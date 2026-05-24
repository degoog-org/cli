import { access, readFile } from "node:fs/promises"
import { join, basename, dirname } from "node:path"
import type { ExtensionKind, StoreManifest, Target } from "./types.ts"
import { EXTENSION_CATEGORIES } from "./types.ts"

export const exists = async (path: string): Promise<boolean> => {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

const KIND_FROM_FOLDER: Record<string, ExtensionKind> = {
  themes: "theme",
  plugins: "plugin",
  engines: "engine",
  transports: "transport",
  autocomplete: "autocomplete",
}

const detectKindFromParent = (dir: string): ExtensionKind => {
  const parent = basename(dirname(dir))
  return KIND_FROM_FOLDER[parent] ?? "unknown"
}

export const isExtensionDir = async (dir: string): Promise<boolean> => {
  if (await exists(join(dir, "theme.json"))) return true
  if (await exists(join(dir, "index.ts"))) return true
  if (await exists(join(dir, "index.js"))) return true
  return false
}

export const detectExtKind = async (dir: string): Promise<ExtensionKind> => {
  if (await exists(join(dir, "theme.json"))) return "theme"
  return detectKindFromParent(dir)
}

const readStoreManifest = async (
  dir: string,
): Promise<{ path: string; manifest: StoreManifest } | null> => {
  const path = join(dir, "package.json")
  if (!(await exists(path))) return null
  try {
    const manifest = JSON.parse(await readFile(path, "utf-8")) as StoreManifest
    const hasAny = EXTENSION_CATEGORIES.some((c) => Array.isArray(manifest[c]))
    if (!hasAny) return null
    return { path, manifest }
  } catch {
    return null
  }
}

export const detectTarget = async (dir: string): Promise<Target | null> => {
  const store = await readStoreManifest(dir)
  if (store) {
    return { kind: "store", dir, manifestPath: store.path, manifest: store.manifest }
  }
  if (await isExtensionDir(dir)) {
    const extKind = await detectExtKind(dir)
    return { kind: "extension", dir, extKind }
  }
  return null
}
