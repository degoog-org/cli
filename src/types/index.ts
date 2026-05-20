export enum ExtType {
  Engine = "engine",
  Transport = "transport",
  Autocomplete = "autocomplete",
  Theme = "theme",
  PluginBang = "plugin-bang",
  PluginSlot = "plugin-slot",
  PluginTab = "plugin-tab",
  PluginIntercept = "plugin-intercept",
  PluginMiddleware = "plugin-middleware",
  PluginRoutes = "plugin-routes",
}

export type GeneratorCtx = {
  name: string
  outDir: string
  config: Config
}

export type Config = {
  instanceUrl?: string
  apiKey?: string
  username?: string
  website?: string
}

export type CreateArgs = {
  name?: string
  type?: string
  out?: string
}
