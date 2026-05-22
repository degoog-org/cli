import { readFile, writeFile, access } from "node:fs/promises"
import { join, basename, resolve } from "node:path"
import * as p from "@clack/prompts"
import { t } from "../utils/theme.ts"
import { logger } from "../utils/logger.ts"
import { ExtType } from "../types/index.ts"

const PASS = t.success("PASS")
const FAIL = t.danger("FAIL")
const WARN = t.warning("WARN")
const FIX  = t.success("FIX ")

type CheckResult = { label: string; status: "pass" | "fail" | "warn" | "fix"; detail?: string }

const exists = async (path: string) => {
  try { await access(path); return true }
  catch { return false }
}

const readJson = async <T>(path: string): Promise<T | null> => {
  try { return JSON.parse(await readFile(path, "utf-8")) as T }
  catch { return null }
}

const writeJson = async (path: string, data: unknown) =>
  writeFile(path, JSON.stringify(data, null, 2) + "\n", "utf-8")

const detectType = async (dir: string): Promise<ExtType | null> => {
  if (await exists(join(dir, "theme.json"))) return ExtType.Theme
  if (!await exists(join(dir, "index.ts"))) return null
  try {
    const src = await readFile(join(dir, "index.ts"), "utf-8")
    if (src.includes("export") && src.includes("engine")) return ExtType.Engine
    if (src.includes("export") && src.includes("autocomplete")) return ExtType.Autocomplete
    if (src.includes("export") && src.includes("bang")) return ExtType.PluginBang
    if (src.includes("export") && src.includes("slot")) return ExtType.PluginSlot
    if (src.includes("export") && src.includes("tab")) return ExtType.PluginTab
    return null
  } catch {
    return null
  }
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
  if (!doFix) return { label: `manifest has "${field}"`, status: "fail", detail: missing ? "missing" : "empty" }
  manifest[field] = defaultVal
  await writeJson(manifestPath, manifest)
  return { label: `manifest has "${field}"`, status: "fix", detail: `set to ${JSON.stringify(defaultVal)}` }
}

const checkThemePaths = async (
  manifest: Record<string, unknown>,
  dir: string,
): Promise<CheckResult[]> => {
  const results: CheckResult[] = []
  const check = async (label: string, filePath: string) => {
    const full = join(dir, filePath)
    const ok = await exists(full)
    results.push({ label, status: ok ? "pass" : "warn", detail: ok ? undefined : `missing: ${filePath}` })
  }

  if (typeof manifest.css === "string") await check(`css file resolves`, manifest.css)

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

const runChecks = async (dir: string, doFix: boolean): Promise<{ results: CheckResult[]; failed: boolean }> => {
  const results: CheckResult[] = []
  let failed = false

  const extType = await detectType(dir)
  if (!extType) {
    results.push({ label: "extension type detected", status: "fail", detail: "no theme.json or recognisable index.ts found" })
    return { results, failed: true }
  }
  results.push({ label: `extension type: ${extType}`, status: "pass" })

  const manifestName = extType === ExtType.Theme ? "theme.json" : "author.json"
  const manifestPath = join(dir, extType === ExtType.Theme ? "theme.json" : "index.ts")

  if (extType === ExtType.Theme) {
    const themePath = join(dir, "theme.json")
    let manifest = await readJson<Record<string, unknown>>(themePath)

    if (!manifest) {
      if (doFix) {
        manifest = { name: basename(dir), description: "", version: "1.0.0" }
        await writeJson(themePath, manifest)
        results.push({ label: "theme.json exists", status: "fix", detail: "created minimal manifest" })
      } else {
        results.push({ label: "theme.json exists", status: "fail" })
        failed = true
      }
      manifest = manifest ?? {}
    } else {
      results.push({ label: "theme.json exists", status: "pass" })
    }

    for (const [field, def, req] of [["name", basename(dir), true], ["description", "", false], ["version", "1.0.0", true]] as const) {
      const r = await checkManifestField(manifest, field, themePath, doFix, def, req)
      results.push(r)
      if (r.status === "fail") failed = true
    }

    const pathChecks = await checkThemePaths(manifest, dir)
    results.push(...pathChecks)
    if (pathChecks.some(c => c.status === "warn")) failed = true
  }

  const authorPath = join(dir, "author.json")
  const authorExists = await exists(authorPath)
  if (!authorExists) {
    if (doFix) {
      await writeJson(authorPath, { name: "", url: "" })
      results.push({ label: "author.json exists", status: "fix", detail: "created with empty fields" })
    } else {
      results.push({ label: "author.json exists", status: "fail" })
      failed = true
    }
  } else {
    results.push({ label: "author.json exists", status: "pass" })
  }

  return { results, failed }
}

const statusIcon = (s: CheckResult["status"]) => {
  if (s === "pass") return PASS
  if (s === "fail") return FAIL
  if (s === "warn") return WARN
  return FIX
}

export const doctorCmd = async () => {
  const argStart = process.argv[2] === "doctor" ? 3 : 2
  const args = process.argv.slice(argStart)
  const doFix = args.includes("--fix")
  const pathArg = args.find(a => !a.startsWith("-"))

  p.intro(t.brand("degoog doctor"))

  let targetDir: string

  if (pathArg) {
    targetDir = resolve(process.cwd(), pathArg)
  } else {
    const input = await p.text({
      message: t.muted("path to the extension folder"),
      placeholder: process.cwd(),
      validate: (v) => {
        if (!v.trim()) return undefined
        return undefined
      },
    })
    if (p.isCancel(input)) {
      p.cancel(t.muted("cancelled"))
      process.exit(0)
    }
    targetDir = resolve(process.cwd(), (input as string).trim() || process.cwd())
  }

  const applyFix = doFix || (await p.confirm({
    message: t.muted("apply safe fixes automatically?"),
    initialValue: false,
  })) === true

  if (p.isCancel(applyFix)) {
    p.cancel(t.muted("cancelled"))
    process.exit(0)
  }

  const dirExists = await exists(targetDir)
  if (!dirExists) {
    logger.error(`directory not found: ${targetDir}`)
    process.exit(1)
  }

  p.log.info(t.muted(`checking ${targetDir}`))

  const { results, failed } = await runChecks(targetDir, applyFix)

  for (const r of results) {
    const icon = statusIcon(r.status)
    const detail = r.detail ? t.muted(` - ${r.detail}`) : ""
    console.log(`  ${icon}  ${r.label}${detail}`)
  }

  console.log("")

  if (failed && !applyFix) {
    p.outro(t.danger("issues found - re-run and choose to apply fixes, or pass --fix"))
    process.exit(1)
  } else if (failed) {
    p.outro(t.warning("some issues could not be auto-fixed (see WARN above)"))
    process.exit(1)
  } else {
    p.outro(t.success("all checks passed"))
  }
}
