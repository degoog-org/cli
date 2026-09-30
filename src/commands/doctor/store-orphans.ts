import { readdir, stat } from "node:fs/promises"
import { join, basename } from "node:path"
import { t } from "../../utils/theme"
import { ui } from "../../utils/ui"
import { argv } from "../../utils/argv"
import { isHeadless } from "../../utils/headless"
import { promptConfirm, promptSelect } from "../../utils/prompts"
import { exists } from "./detect"
import type { ExtensionCategory, StoreEntry } from "./types"
import { EXTENSION_CATEGORIES, PLUGIN_TYPES, type PluginType } from "./types"

export type Orphan = {
  category: ExtensionCategory
  relPath: string
}

const listOrphansInCategory = async (
  storeDir: string,
  category: ExtensionCategory,
  entries: StoreEntry[],
): Promise<string[]> => {
  const categoryDir = join(storeDir, category)
  if (!(await exists(categoryDir))) return []

  let names: string[]
  try {
    names = await readdir(categoryDir)
  } catch {
    return []
  }

  const known = new Set(
    entries
      .map((e) => e.path)
      .filter((path): path is string => typeof path === "string"),
  )

  const orphans: string[] = []
  for (const name of names) {
    const full = join(categoryDir, name)
    let isDir = false
    try {
      isDir = (await stat(full)).isDirectory()
    } catch {
      isDir = false
    }
    if (!isDir) continue
    const rel = `${category}/${name}`
    if (known.has(rel)) continue
    orphans.push(rel)
  }
  return orphans
}

export const collectOrphans = async (
  storeDir: string,
  manifest: { [K in ExtensionCategory]?: StoreEntry[] },
): Promise<Orphan[]> => {
  const orphans: Orphan[] = []
  for (const category of EXTENSION_CATEGORIES) {
    const entries = manifest[category] ?? []
    const found = await listOrphansInCategory(storeDir, category, entries)
    for (const relPath of found) orphans.push({ category, relPath })
  }
  return orphans
}

const buildEntry = (orphan: Orphan, type?: PluginType): StoreEntry => {
  const entry: StoreEntry = {
    path: orphan.relPath,
    name: basename(orphan.relPath),
    description: "",
    version: "1.0.0",
  }
  if (orphan.category === "plugins" && type) entry.type = type
  return entry
}

export type OrphanResolution = {
  byCategory: Map<ExtensionCategory, StoreEntry[]>
  added: number
  skipped: number
}

const isPluginType = (v: string | undefined): v is PluginType =>
  (PLUGIN_TYPES as readonly string[]).includes(v ?? "")

const pickPluginType = async (orphan: Orphan): Promise<PluginType | undefined> => {
  if (isPluginType(argv.pluginType)) return argv.pluginType
  if (isHeadless) return undefined
  return promptSelect<PluginType>(
    t.muted(`plugin type for "${orphan.relPath}"`),
    PLUGIN_TYPES.map((v) => ({ value: v, label: v })),
  )
}

export const resolveOrphans = async (
  orphans: Orphan[],
  doFix: boolean,
): Promise<OrphanResolution> => {
  const result: OrphanResolution = {
    byCategory: new Map(),
    added: 0,
    skipped: 0,
  }
  if (orphans.length === 0) return result

  ui.step(t.brand("orphan folders"))
  for (const o of orphans) {
    console.log(`  ${t.warning("WARN")}  ${o.relPath} ${t.muted("- folder exists but not in package.json")}`)
  }

  const register = isHeadless
    ? doFix
    : await promptConfirm(
      t.muted(`register all ${orphans.length} folder(s) in package.json? (defaults: name=folder, version=1.0.0)`),
      true,
    )

  if (!register) {
    result.skipped = orphans.length
    return result
  }

  for (const o of orphans) {
    let type: PluginType | undefined
    if (o.category === "plugins") {
      type = await pickPluginType(o)
      if (!type) {
        console.log(`  ${t.warning("WARN")}  ${o.relPath} ${t.muted(`- skipped, pass --plugin-type <${PLUGIN_TYPES.join("|")}> to register it`)}`)
        result.skipped++
        continue
      }
    }
    const entry = buildEntry(o, type)
    const list = result.byCategory.get(o.category) ?? []
    list.push(entry)
    result.byCategory.set(o.category, list)
    result.added++
  }

  return result
}
