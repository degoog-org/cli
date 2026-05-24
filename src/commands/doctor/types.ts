export type CheckStatus = "pass" | "fail" | "warn" | "fix"

export type CheckResult = {
  label: string
  status: CheckStatus
  detail?: string | undefined
}

export type ExtensionKind = "theme" | "plugin" | "engine" | "transport" | "autocomplete" | "unknown"

export type ExtensionCategory = "themes" | "plugins" | "engines" | "transports" | "autocomplete"

export const EXTENSION_CATEGORIES: ExtensionCategory[] = [
  "plugins",
  "themes",
  "engines",
  "transports",
  "autocomplete",
]

export const CATEGORY_TO_KIND: Record<ExtensionCategory, Exclude<ExtensionKind, "unknown">> = {
  themes: "theme",
  plugins: "plugin",
  engines: "engine",
  transports: "transport",
  autocomplete: "autocomplete",
}

export const PLUGIN_TYPES = ["command", "slot", "interceptor", "search-result-tab"] as const

export type PluginType = typeof PLUGIN_TYPES[number]

export type StoreEntry = {
  path?: string
  name?: string
  description?: string
  version?: string
  type?: string
  minDegoogVersion?: string
  legacyIds?: string[]
  dependencies?: string[]
}

export type StoreManifest = {
  name?: string
  description?: string
  author?: string
  plugins?: StoreEntry[]
  themes?: StoreEntry[]
  engines?: StoreEntry[]
  transports?: StoreEntry[]
  autocomplete?: StoreEntry[]
} & Record<string, unknown>

export type Target =
  | { kind: "extension"; dir: string; extKind: ExtensionKind }
  | { kind: "store"; dir: string; manifestPath: string; manifest: StoreManifest }

export type RunSummary = {
  results: CheckResult[]
  failed: boolean
}

export type StoreRunSummary = {
  passed: number
  failed: number
  fixed: number
}
