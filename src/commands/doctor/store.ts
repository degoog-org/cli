import { writeFile } from "node:fs/promises"
import { join, basename } from "node:path"
import * as p from "@clack/prompts"
import { t } from "../../utils/theme.ts"
import { exists } from "./detect.ts"
import { runChecks } from "./checks.ts"
import { printResults } from "./report.ts"
import {
  validateTopLevel,
  validateEntry,
  validatePathExistence,
  findDuplicateEntries,
} from "./store-validate.ts"
import { collectOrphans, resolveOrphans } from "./store-orphans.ts"
import {
  EXTENSION_CATEGORIES,
  CATEGORY_TO_KIND,
  type CheckResult,
  type ExtensionCategory,
  type StoreEntry,
  type StoreManifest,
  type StoreRunSummary,
} from "./types.ts"

const writeManifest = async (path: string, manifest: StoreManifest): Promise<void> => {
  await writeFile(path, JSON.stringify(manifest, null, 2) + "\n", "utf-8")
}

const tallyResults = (results: CheckResult[], summary: StoreRunSummary): void => {
  for (const r of results) {
    if (r.status === "pass") summary.passed++
    else if (r.status === "fix") summary.fixed++
    else summary.failed++
  }
}

const sectionHeader = (label: string): void => {
  p.log.step(t.brand(label))
}

const collectEntryIssues = async (
  storeDir: string,
  category: ExtensionCategory,
  entries: StoreEntry[],
  doFix: boolean,
): Promise<{ results: CheckResult[]; toRemove: Set<number> }> => {
  const results: CheckResult[] = []
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    if (!entry) continue
    results.push(...validateEntry(entry, category, i))
  }
  results.push(...findDuplicateEntries(entries, category))
  const pathRes = await validatePathExistence(storeDir, category, entries, doFix)
  results.push(...pathRes.results)
  return { results, toRemove: pathRes.toRemove }
}

const processCategory = async (
  storeDir: string,
  category: ExtensionCategory,
  manifest: StoreManifest,
  doFix: boolean,
  summary: StoreRunSummary,
): Promise<boolean> => {
  const raw = manifest[category]
  if (!Array.isArray(raw)) return false

  let entries = raw as StoreEntry[]
  const { results, toRemove } = await collectEntryIssues(storeDir, category, entries, doFix)
  if (results.length > 0) {
    sectionHeader(category)
    printResults(results)
    tallyResults(results, summary)
  }

  if (doFix && toRemove.size > 0) {
    entries = entries.filter((_, i) => !toRemove.has(i))
    manifest[category] = entries
    return true
  }
  return false
}

const handleOrphans = async (
  storeDir: string,
  manifest: StoreManifest,
  summary: StoreRunSummary,
): Promise<boolean> => {
  const orphans = await collectOrphans(storeDir, manifest)
  if (orphans.length === 0) return false

  const resolution = await resolveOrphans(orphans)
  summary.fixed += resolution.added
  summary.failed += resolution.skipped

  if (resolution.added === 0) return false

  for (const [category, additions] of resolution.byCategory) {
    const current = (manifest[category] as StoreEntry[] | undefined) ?? []
    manifest[category] = [...current, ...additions]
  }
  return true
}

const runExtensionChecks = async (
  storeDir: string,
  manifest: StoreManifest,
  doFix: boolean,
  summary: StoreRunSummary,
): Promise<void> => {
  for (const category of EXTENSION_CATEGORIES) {
    const raw = manifest[category]
    if (!Array.isArray(raw)) continue
    const entries = raw as StoreEntry[]
    const kind = CATEGORY_TO_KIND[category]

    for (const entry of entries) {
      if (typeof entry.path !== "string") continue
      const full = join(storeDir, entry.path)
      if (!(await exists(full))) continue

      sectionHeader(`${category}/${basename(entry.path)}`)
      const { results } = await runChecks(full, doFix, kind)
      printResults(results)
      tallyResults(results, summary)
    }
  }
}

export const runStoreChecks = async (
  storeDir: string,
  manifestPath: string,
  manifest: StoreManifest,
  doFix: boolean,
): Promise<StoreRunSummary> => {
  const summary: StoreRunSummary = { passed: 0, failed: 0, fixed: 0 }

  sectionHeader("package.json")
  const topResults = validateTopLevel(manifest)
  printResults(topResults)
  tallyResults(topResults, summary)

  let manifestMutated = false
  for (const category of EXTENSION_CATEGORIES) {
    const changed = await processCategory(storeDir, category, manifest, doFix, summary)
    if (changed) manifestMutated = true
  }

  const addedOrphans = await handleOrphans(storeDir, manifest, summary)
  if (addedOrphans) manifestMutated = true

  if (manifestMutated) {
    await writeManifest(manifestPath, manifest)
  }

  await runExtensionChecks(storeDir, manifest, doFix, summary)

  return summary
}
