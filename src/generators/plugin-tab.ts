import { scaffoldDir, authorJsonTpl, readmeTpl } from "../utils/files"
import type { GeneratorCtx } from "../types"

const indexTpl = (name: string) => `// If this file also exports other hooks (slot, interceptor, command, etc.) and
// you want a single settings card for all of them, add a top-level plugin identity:
//
// export const plugin = {
//   id: "${name}",
//   name: "${name}",
//   description: "...",
//   settingsSchema: [ /* shared fields */ ],
// };
//
// Every hook in this file then shares that id and shows as one card in settings.

export const tab = {
  id: "${name}",
  name: "${name}",
  // icon: "🔍",
  // engineType: "web", // use this OR executeSearch, not both

  /**
   * Set to true if your executeSearch() returns results whose URLs or
   * thumbnails are fetched directly by the browser (not proxied).
   * Set to false if all network access goes through context.fetch / signProxyUrl.
   * Leave it unset and the degoog settings page shows an ambiguous badge.
   */
  isClientExposed: false,

  // settingsId: "${name}",
  // settingsSchema: [
  //   { key: "mode", label: "Mode", type: "select", options: ["simple", "custom"], default: "simple" },
  //   // visibleWhen shows a field only while another field holds a value.
  //   // equals takes one value or an array of them. In an array of rules, every rule must match.
  //   { key: "customUrl", label: "Custom URL", type: "url", visibleWhen: { key: "mode", equals: "custom" } },
  // ],
  //
  // configure(settings) {},
  // needsAppRestart: true, // set true if this tab needs a server restart to work (e.g. registers a WebSocket route)
  //
  // async init(ctx) {
  //   ctx.template // template.html contents
  //   ctx.pluginId // installed plugin folder ID assigned by degoog (alias: ctx.id)
  //   ctx.apiBase  // /api/plugin/<ctx.pluginId>, the base for your own routes
  //   ctx.routeUrl // (path) => /api/plugin/<ctx.pluginId>/<path>
  //   ctx.dir      // absolute path to plugin folder (do NOT derive route IDs from it)
  //   ctx.readFile // async file reader
  //   ctx.signProxyUrl   // (url) => signed /api/proxy/image URL for an external image
  //   ctx.signFaviconUrl // (url) => signed /api/proxy/favicon URL for the url's host, "" when no favicon provider is enabled
  // },
  // dependencies: [],

  async executeSearch(query: string, page = 1, context: {
    dir: string
    fetch: typeof fetch
    signProxyUrl: (url: string) => string
    useCache: <T>(namespace: string, defaultTtlMs: number) => {
      get: (key: string) => Promise<T | null>
      set: (key: string, value: T, ttlMs?: number) => Promise<void>
      delete: (key: string) => Promise<void>
      clear: () => Promise<void>
    }
  }) {
    const results: Array<{
      title: string
      url: string
      snippet: string
      source: string
      thumbnail?: string
    }> = []

    // TODO: implement search logic

    return {
      results,
      // totalPages: 1,
    }
  },
}
`

export const generatePluginTab = async (ctx: GeneratorCtx) =>
  scaffoldDir(ctx.outDir, ctx.name, {
    "index.ts": indexTpl(ctx.name),
    "README.md": readmeTpl(ctx.name, "A search result tab plugin for degoog."),
    "author.json": authorJsonTpl(ctx.config),
  })
