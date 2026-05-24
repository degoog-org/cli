import { scaffoldDir, authorJsonTpl, readmeTpl } from "../utils/files.ts"
import type { GeneratorCtx } from "../types/index.ts"

const indexTpl = (name: string) => `export const tab = {
  id: "${name}",
  name: "${name}",
  // icon: "🔍",
  // engineType: "web", // use this OR executeSearch, not both

  /**
   * Set to true if your executeSearch() returns results whose URLs or
   * thumbnails are fetched directly by the browser (not proxied).
   * Set to false if all network access goes through context.fetch / signProxyUrl.
   * Leaving this unset shows an ambiguous badge in the degoog settings page.
   */
  isClientExposed: false,

  // settingsId: "${name}",
  // settingsSchema: [
  //   { key: "setting", label: "Setting", type: "text" },
  // ],
  //
  // configure(settings) {},
  // async init(ctx) {
  //   ctx.template // template.html contents
  //   ctx.pluginId // installed plugin folder ID assigned by degoog (alias: ctx.id)
  //   ctx.apiBase  // /api/plugin/<ctx.pluginId> - base for your own routes
  //   ctx.routeUrl // (path) => /api/plugin/<ctx.pluginId>/<path>
  //   ctx.dir      // absolute path to plugin folder (do NOT derive route IDs from it)
  //   ctx.readFile // async file reader
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
