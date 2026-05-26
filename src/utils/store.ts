import { readFile, writeFile } from "node:fs/promises"
import { join, basename, dirname, resolve } from "node:path"
import {
  EXTENSION_CATEGORIES,
  type ExtensionCategory,
  type PluginType,
  type StoreEntry,
  type StoreManifest,
} from "../commands/doctor/types.ts"
import { ExtType, type Config } from "../types/index.ts"
import { exists, mkdirp } from "./files.ts"
import { logger } from "./logger.ts"

export type StoreRoot = {
  dir: string
  manifestPath: string
  manifest: StoreManifest
}

export const readStoreManifest = async (
  dir: string,
): Promise<StoreRoot | null> => {
  const manifestPath = join(dir, "package.json")
  if (!(await exists(manifestPath))) return null
  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf-8")) as StoreManifest
    const hasAny = EXTENSION_CATEGORIES.some((c) => Array.isArray(manifest[c]))
    if (!hasAny) return null
    return { dir, manifestPath, manifest }
  } catch {
    return null
  }
}

export const findStoreRoot = async (startDir: string): Promise<StoreRoot | null> => {
  let current = resolve(startDir)
  while (true) {
    const store = await readStoreManifest(current)
    if (store) return store
    const parent = dirname(current)
    if (parent === current) return null
    current = parent
  }
}

const EXT_TYPE_CATEGORY: Record<ExtType, ExtensionCategory> = {
  [ExtType.Engine]: "engines",
  [ExtType.Transport]: "transports",
  [ExtType.Autocomplete]: "autocomplete",
  [ExtType.Theme]: "themes",
  [ExtType.PluginBang]: "plugins",
  [ExtType.PluginSlot]: "plugins",
  [ExtType.PluginTab]: "plugins",
  [ExtType.PluginIntercept]: "plugins",
  [ExtType.PluginMiddleware]: "plugins",
  [ExtType.PluginRoutes]: "plugins",
}

export const extTypeToCategory = (extType: ExtType): ExtensionCategory =>
  EXT_TYPE_CATEGORY[extType]

const EXT_TYPE_PLUGIN_TYPE: Partial<Record<ExtType, PluginType>> = {
  [ExtType.PluginBang]: "command",
  [ExtType.PluginSlot]: "slot",
  [ExtType.PluginTab]: "search-result-tab",
  [ExtType.PluginIntercept]: "interceptor",
}

export const buildStoreEntry = (name: string, extType: ExtType): StoreEntry => {
  const category = extTypeToCategory(extType)
  const entry: StoreEntry = {
    path: `${category}/${name}`,
    name,
    description: "",
    version: "1.0.0",
  }
  if (category === "plugins") {
    entry.type = EXT_TYPE_PLUGIN_TYPE[extType] ?? "command"
  }
  return entry
}

export const registerExtensionInStore = async (
  storeDir: string,
  name: string,
  extType: ExtType,
): Promise<void> => {
  const store = await readStoreManifest(storeDir)
  if (!store) return

  const category = extTypeToCategory(extType)
  const entry = buildStoreEntry(name, extType)
  const manifest = { ...store.manifest }
  const existing = manifest[category]
  const list = Array.isArray(existing) ? [...(existing as StoreEntry[])] : []

  if (list.some((e) => e.path === entry.path)) return

  list.push(entry)
  manifest[category] = list
  await writeFile(store.manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf-8")
  logger.success(`registered ${entry.path} in package.json`)
}

export const scaffoldStore = async (dir: string, config: Config): Promise<void> => {
  const resolved = resolve(dir)
  const name = basename(resolved)
  const manifest: StoreManifest = {
    name,
    description: `${name} extensions for degoog`,
    author: config.username ?? "",
    plugins: [],
    themes: [],
    engines: [],
    transports: [],
    autocomplete: [],
  }

  const manifestPath = join(resolved, "package.json")
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf-8")
  logger.success(`created ${manifestPath}`)

  for (const category of EXTENSION_CATEGORIES) {
    const categoryDir = join(resolved, category)
    await mkdirp(categoryDir)
    logger.success(`created ${categoryDir}`)
  }
}
