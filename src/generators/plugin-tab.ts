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
  // async init(ctx) {},
  // dependencies: [],

  async executeSearch(query: string, page = 1, context: {
    dir: string
    fetch: typeof fetch
    signProxyUrl: (url: string) => string
    createCache: <T>(ttlMs: number) => {
      get: (key: string) => T | undefined
      set: (key: string, value: T) => void
      clear: () => void
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
