import { readFile, writeFile, readdir } from "node:fs/promises"
import { join, basename } from "node:path"
import { exists } from "./detect.ts"
import { findStoreRoot } from "../../utils/store.ts"
import type { CheckResult, ExtensionKind, RunSummary } from "./types.ts"

const readJson = async <T>(path: string): Promise<T | null> => {
  try {
    return JSON.parse(await readFile(path, "utf-8")) as T
  } catch {
    return null
  }
}

const writeJson = async (path: string, data: unknown): Promise<void> => {
  await writeFile(path, JSON.stringify(data, null, 2) + "\n", "utf-8")
}

const checkManifestField = async (
  manifest: Record<string, unknown>,
  field: string,
  manifestPath: string,
  doFix: boolean,
  defaultVal: unknown,
  requireNonEmpty = false,
): Promise<CheckResult> => {
  const missing = manifest[field] == null
  const empty = requireNonEmpty && String(manifest[field] ?? "").trim() === ""
  if (!missing && !empty) return { label: `manifest has "${field}"`, status: "pass" }
  if (!doFix) {
    return {
      label: `manifest has "${field}"`,
      status: "fail",
      detail: missing ? "missing" : "empty",
    }
  }
  manifest[field] = defaultVal
  await writeJson(manifestPath, manifest)
  return {
    label: `manifest has "${field}"`,
    status: "fix",
    detail: `set to ${JSON.stringify(defaultVal)}`,
  }
}

const checkThemePaths = async (
  manifest: Record<string, unknown>,
  dir: string,
): Promise<CheckResult[]> => {
  const results: CheckResult[] = []
  const check = async (label: string, filePath: string): Promise<void> => {
    const full = join(dir, filePath)
    const ok = await exists(full)
    results.push({
      label,
      status: ok ? "pass" : "warn",
      detail: ok ? undefined : `missing: ${filePath}`,
    })
  }

  if (typeof manifest.css === "string") await check("css file resolves", manifest.css)

  const html = manifest.html as Record<string, string> | undefined
  if (html && typeof html === "object") {
    for (const [key, path] of Object.entries(html)) {
      if (typeof path === "string") await check(`html.${key} resolves`, path)
    }
  }

  const templates = manifest.templates as Record<string, string> | undefined
  if (templates && typeof templates === "object") {
    for (const [key, path] of Object.entries(templates)) {
      if (typeof path === "string") await check(`templates.${key} resolves`, path)
    }
  }

  return results
}

const SOURCE_EXT = /\.(js|mjs|cjs|ts)$/
const PLUGIN_LITERAL_RE = /(["'`])\/api\/plugin\/([A-Za-z0-9._-]+)((?:\/[^"'`]*)?)\1/g
const PLUGIN_LITERAL_TEST = /(["'`])\/api\/plugin\/[A-Za-z0-9._-]+/
const BASENAME_DIR_RE = /basename\(\s*ctx\.dir\s*\)/g
const BASENAME_IMPORT_RE = /^\s*import\s*\{\s*basename\s*\}\s*from\s*["'](?:node:)?path["'];?\s*$\n?/m

const migrateClientScript = (src: string): { out: string; count: number } => {
  let count = 0
  const out = src.replace(PLUGIN_LITERAL_RE, (_m, _q, _id, rest: string) => {
    count++
    return "`/api/plugin/${__PLUGIN_ID__}" + (rest || "") + "`"
  })
  return { out, count }
}

const migrateServerSource = (src: string): { out: string; basenameFixed: number } => {
  let basenameFixed = 0
  let out = src.replace(BASENAME_DIR_RE, () => {
    basenameFixed++
    return "ctx.pluginId"
  })
  if (basenameFixed > 0) {
    const withoutImport = out.replace(BASENAME_IMPORT_RE, "")
    if (!/\bbasename\b/.test(withoutImport)) out = withoutImport
  }
  return { out, basenameFixed }
}

const checkRouteConventions = async (dir: string, doFix: boolean): Promise<CheckResult[]> => {
  const results: CheckResult[] = []
  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch {
    return results
  }
  const sourceFiles = entries.filter((e) => SOURCE_EXT.test(e))
  let hadFindings = false

  for (const file of sourceFiles) {
    const full = join(dir, file)
    let src: string
    try {
      src = await readFile(full, "utf-8")
    } catch {
      continue
    }
    const isClientScript = file === "script.js"

    if (isClientScript) {
      const { out, count } = migrateClientScript(src)
      if (count === 0) continue
      hadFindings = true
      if (doFix) {
        await writeFile(full, out, "utf-8")
        results.push({
          label: `${file} route IDs`,
          status: "fix",
          detail: `rewrote ${count} hardcoded /api/plugin/<id> to __PLUGIN_ID__`,
        })
      } else {
        results.push({
          label: `${file} route IDs`,
          status: "fail",
          detail: `${count} hardcoded /api/plugin/<id> - use \`/api/plugin/\${__PLUGIN_ID__}/...\``,
        })
      }
      continue
    }

    const { out, basenameFixed } = migrateServerSource(src)
    if (doFix && basenameFixed > 0) {
      hadFindings = true
      await writeFile(full, out, "utf-8")
      results.push({
        label: `${file} route IDs`,
        status: "fix",
        detail: `replaced ${basenameFixed} basename(ctx.dir) with ctx.pluginId`,
      })
    } else if (basenameFixed > 0) {
      hadFindings = true
      results.push({
        label: `${file} route IDs`,
        status: "fail",
        detail: "basename(ctx.dir) used for route ID - use ctx.pluginId / ctx.apiBase",
      })
    }

    const finalSrc = doFix ? out : src
    if (PLUGIN_LITERAL_TEST.test(finalSrc)) {
      hadFindings = true
      results.push({
        label: `${file} route IDs`,
        status: "warn",
        detail: "hardcoded /api/plugin/<id> in backend - build URLs from ctx.apiBase / ctx.routeUrl()",
      })
    }
  }

  if (!hadFindings) {
    results.push({ label: "route IDs use __PLUGIN_ID__ / ctx.apiBase", status: "pass" })
  }
  return results
}

const runThemeChecks = async (dir: string, doFix: boolean): Promise<RunSummary> => {
  const results: CheckResult[] = []
  let failed = false

  const themePath = join(dir, "theme.json")
  let manifest = await readJson<Record<string, unknown>>(themePath)

  if (!manifest) {
    if (doFix) {
      manifest = { name: basename(dir), description: "" }
      await writeJson(themePath, manifest)
      results.push({ label: "theme.json exists", status: "fix", detail: "created minimal manifest" })
    } else {
      results.push({ label: "theme.json exists", status: "fail" })
      failed = true
      manifest = {}
    }
  } else {
    results.push({ label: "theme.json exists", status: "pass" })
  }

  if ("version" in manifest) {
    if (doFix) {
      delete manifest.version
      await writeJson(themePath, manifest)
      results.push({
        label: 'theme.json has no "version"',
        status: "fix",
        detail: "removed deprecated field",
      })
    } else {
      results.push({
        label: 'theme.json has no "version"',
        status: "warn",
        detail: "deprecated - version lives in store package.json",
      })
    }
  }

  for (const [field, def, req] of [
    ["name", basename(dir), true],
    ["description", "", false],
  ] as const) {
    const r = await checkManifestField(manifest, field, themePath, doFix, def, req)
    results.push(r)
    if (r.status === "fail") failed = true
  }

  const pathChecks = await checkThemePaths(manifest, dir)
  results.push(...pathChecks)
  if (pathChecks.some((c) => c.status === "warn")) failed = true

  return { results, failed }
}

const checkAuthorJson = async (
  dir: string,
  doFix: boolean,
): Promise<{ result: CheckResult; failed: boolean }> => {
  const authorPath = join(dir, "author.json")
  if (await exists(authorPath)) {
    return { result: { label: "author.json exists", status: "pass" }, failed: false }
  }
  if (doFix) {
    await writeJson(authorPath, { name: "", url: "" })
    return {
      result: { label: "author.json exists", status: "fix", detail: "created with empty fields" },
      failed: false,
    }
  }
  return { result: { label: "author.json exists", status: "fail" }, failed: true }
}

export const runChecks = async (
  dir: string,
  doFix: boolean,
  kind: ExtensionKind,
): Promise<RunSummary> => {
  const results: CheckResult[] = []
  let failed = false

  if (kind === "unknown") {
    results.push({
      label: "extension type detected",
      status: "fail",
      detail: "no theme.json or index.{ts,js} found, and parent folder doesn't match a known category",
    })
    return { results, failed: true }
  }

  results.push({ label: `extension type: ${kind}`, status: "pass" })

  if (kind === "theme") {
    const themeRes = await runThemeChecks(dir, doFix)
    results.push(...themeRes.results)
    if (themeRes.failed) failed = true
  }

  const inStore = await findStoreRoot(dir)
  if (!inStore) {
    const authorRes = await checkAuthorJson(dir, doFix)
    results.push(authorRes.result)
    if (authorRes.failed) failed = true
  }

  if (kind === "plugin") {
    const routeChecks = await checkRouteConventions(dir, doFix)
    results.push(...routeChecks)
    if (routeChecks.some((c) => c.status === "fail")) failed = true
  }

  return { results, failed }
}
