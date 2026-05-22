import { scaffoldDir, authorJsonTpl, readmeTpl } from "../utils/files.ts"
import type { GeneratorCtx } from "../types/index.ts"

const indexTpl = (name: string) => `// positions: above-results | below-results | above-sidebar | below-sidebar | knowledge-panel | at-a-glance
export const slot = {
  id: "${name}",
  name: "${name}",
  position: "above-results",

  /**
   * Set to true if your execute() returns HTML that causes the browser
   * to fetch external URLs (images, scripts, etc.).
   * Set to false if all network access goes through context.fetch / signProxyUrl.
   * Leaving this unset shows an ambiguous badge in the degoog settings page.
   */
  isClientExposed: false,

  // waitForResults: false,
  // settingsId: "${name}",
  // settingsSchema: [
  //   { key: "setting", label: "Setting", type: "text" },
  // ],
  //
  // configure(settings) {},
  // async init(ctx) {},

  async trigger(query: string): Promise<boolean> {
    // return true to activate this slot for the given query
    return query.length > 0
  },

  async execute(query: string, context: {
    dir: string
    readFile: (filename: string) => Promise<string>
    signProxyUrl: (url: string) => string
    fetch: typeof fetch
    useCache: <T>(namespace: string, defaultTtlMs: number) => {
      get: (key: string) => Promise<T | null>
      set: (key: string, value: T, ttlMs?: number) => Promise<void>
      delete: (key: string) => Promise<void>
      clear: () => Promise<void>
    }
  }) {
    return {
      // title: "${name}",
      html: "<p>Slot content</p>",
    }
  },
}
`

export const generatePluginSlot = async (ctx: GeneratorCtx) =>
  scaffoldDir(ctx.outDir, ctx.name, {
    "index.ts": indexTpl(ctx.name),
    "README.md": readmeTpl(ctx.name, "A slot plugin that injects a panel into degoog search results."),
    "author.json": authorJsonTpl(ctx.config),
  })
