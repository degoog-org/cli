import * as p from "@clack/prompts"
import { ExtType } from "../types/index.ts"

type SelectOption = { value: string; label: string; hint?: string }

const PLUGIN_SUBTYPES: SelectOption[] = [
  { value: ExtType.PluginBang, label: "Bang Command", hint: "!trigger query -> HTML result" },
  { value: ExtType.PluginSlot, label: "Slot", hint: "inject panels into search results" },
  { value: ExtType.PluginTab, label: "Search Result Tab", hint: "custom tab in results" },
  { value: ExtType.PluginIntercept, label: "Query Interceptor", hint: "modify queries before search" },
  { value: ExtType.PluginMiddleware, label: "Request Middleware", hint: "hook into request flows" },
  { value: ExtType.PluginRoutes, label: "Plugin Routes", hint: "custom HTTP endpoints" },
]

const TOP_LEVEL: SelectOption[] = [
  { value: ExtType.Engine, label: "Engine", hint: "custom search engine" },
  { value: ExtType.Transport, label: "Transport", hint: "custom HTTP fetch strategy" },
  { value: ExtType.Autocomplete, label: "Autocomplete Provider", hint: "search suggestions" },
  { value: ExtType.Theme, label: "Theme", hint: "UI theme with CSS and templates" },
  { value: "plugin", label: "Plugin", hint: "bang command, slot, tab, interceptor, middleware or route" },
]

export const promptExtType = async (): Promise<ExtType | undefined> => {
  const top = await p.select({
    message: "What type of extension?",
    options: TOP_LEVEL,
  })

  if (p.isCancel(top)) return undefined
  if (top !== "plugin") return top as ExtType

  const sub = await p.select({
    message: "Which plugin subtype?",
    options: PLUGIN_SUBTYPES,
  })

  if (p.isCancel(sub)) return undefined
  return sub as ExtType
}
