import { stat } from "node:fs/promises"
import { join } from "node:path"
import { exists } from "./detect.ts"
import type { CheckResult, ExtensionCategory, StoreEntry, StoreManifest } from "./types.ts"

export const validateTopLevel = (manifest: StoreManifest): CheckResult[] => {
  const results: CheckResult[] = []
  for (const field of ["name", "description", "author"] as const) {
    const v = manifest[field]
    if (typeof v !== "string" || v.trim() === "") {
      results.push({
        label: `package.json has "${field}"`,
        status: "fail",
        detail: "missing or empty",
      })
    } else {
      results.push({ label: `package.json has "${field}"`, status: "pass" })
    }
  }
  return results
}

const REQUIRED_ENTRY_FIELDS = ["path", "name", "description", "version"] as const

export const validateEntry = (
  entry: StoreEntry,
  category: ExtensionCategory,
  index: number,
): CheckResult[] => {
  const results: CheckResult[] = []
  const label = `${category}[${index}]${entry.path ? ` "${entry.path}"` : ""}`

  for (const field of REQUIRED_ENTRY_FIELDS) {
    const v = entry[field]
    if (typeof v !== "string" || v.trim() === "") {
      results.push({
        label: `${label}.${field}`,
        status: "fail",
        detail: "missing or empty",
      })
    }
  }

  if (category === "plugins") {
    if (typeof entry.type !== "string" || entry.type.trim() === "") {
      results.push({
        label: `${label}.type`,
        status: "fail",
        detail: "missing - plugin entries require type",
      })
    }
  }

  return results
}

export const findDuplicateEntries = (
  entries: StoreEntry[],
  category: ExtensionCategory,
): CheckResult[] => {
  const seen = new Map<string, number>()
  const results: CheckResult[] = []
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    if (!entry || typeof entry.path !== "string") continue
    const prev = seen.get(entry.path)
    if (prev !== undefined) {
      results.push({
        label: `${category}[${i}] "${entry.path}"`,
        status: "fail",
        detail: `duplicate of ${category}[${prev}]`,
      })
    } else {
      seen.set(entry.path, i)
    }
  }
  return results
}

export type PathValidation = {
  results: CheckResult[]
  toRemove: Set<number>
}

export const validatePathExistence = async (
  storeDir: string,
  category: ExtensionCategory,
  entries: StoreEntry[],
  doFix: boolean,
): Promise<PathValidation> => {
  const results: CheckResult[] = []
  const toRemove = new Set<number>()

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    if (!entry || typeof entry.path !== "string") continue
    const full = join(storeDir, entry.path)
    let isDir = false
    if (await exists(full)) {
      try {
        isDir = (await stat(full)).isDirectory()
      } catch {
        isDir = false
      }
    }
    if (isDir) continue
    if (doFix) {
      toRemove.add(i)
      results.push({
        label: `${category}[${i}] "${entry.path}"`,
        status: "fix",
        detail: "removed - folder missing on disk",
      })
    } else {
      results.push({
        label: `${category}[${i}] "${entry.path}"`,
        status: "fail",
        detail: "folder does not exist on disk",
      })
    }
  }

  return { results, toRemove }
}
