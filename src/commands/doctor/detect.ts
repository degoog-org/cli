import { join, basename, dirname } from "node:path"
import { exists } from "../../utils/files.ts"
import { readStoreManifest } from "../../utils/store.ts"
import type { ExtensionKind, Target } from "./types.ts"

export { exists }

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

export const detectTarget = async (dir: string): Promise<Target | null> => {
  const store = await readStoreManifest(dir)
  if (store) {
    return { kind: "store", dir, manifestPath: store.manifestPath, manifest: store.manifest }
  }
  if (await isExtensionDir(dir)) {
    const extKind = await detectExtKind(dir)
    return { kind: "extension", dir, extKind }
  }
  return null
}
