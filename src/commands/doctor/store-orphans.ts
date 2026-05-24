import { readdir, stat } from "node:fs/promises"
import { join, basename } from "node:path"
import * as p from "@clack/prompts"
import { t } from "../../utils/theme.ts"
import { promptConfirm, promptSelect } from "../../utils/prompts.ts"
import { exists } from "./detect.ts"
import type { ExtensionCategory, StoreEntry } from "./types.ts"
import { PLUGIN_TYPES, type PluginType } from "./types.ts"

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
  const categories: ExtensionCategory[] = ["plugins", "themes", "engines", "transports", "autocomplete"]
  for (const category of categories) {
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

export const resolveOrphans = async (orphans: Orphan[]): Promise<OrphanResolution> => {
  const result: OrphanResolution = {
    byCategory: new Map(),
    added: 0,
    skipped: 0,
  }
  if (orphans.length === 0) return result

  p.log.step(t.brand("orphan folders"))
  for (const o of orphans) {
    console.log(`  ${t.warning("WARN")}  ${o.relPath} ${t.muted("- folder exists but not in package.json")}`)
  }

  const register = await promptConfirm(
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
      const picked = await promptSelect<PluginType>(
        t.muted(`plugin type for "${o.relPath}"`),
        PLUGIN_TYPES.map((v) => ({ value: v, label: v })),
      )
      type = picked
    }
    const entry = buildEntry(o, type)
    const list = result.byCategory.get(o.category) ?? []
    list.push(entry)
    result.byCategory.set(o.category, list)
    result.added++
  }

  return result
}
