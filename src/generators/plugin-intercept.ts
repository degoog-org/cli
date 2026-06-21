import { scaffoldDir, authorJsonTpl, readmeTpl } from "../utils/files.ts"
import type { GeneratorCtx } from "../types/index.ts"

const indexTpl = (name: string) => `// If this file also exports a slot or command and you want a single settings
// card for all of them, add a top-level plugin identity export:
//
// export const plugin = {
//   id: "${name}",
//   name: "${name}",
//   description: "...",
//   settingsSchema: [ /* shared fields */ ],
// };
//
// All hooks in this file will share that id and appear as one card in settings.

export const interceptor = {
  name: "${name}",
  description: "Modifies queries before search",

  // settingsSchema: [
  //   { key: "setting", label: "Setting", type: "text" },
  // ],
  //
  // configure(settings) {},
  // async init(ctx) {
  //   ctx.pluginId // installed plugin folder ID assigned by degoog (alias: ctx.id)
  //   ctx.apiBase  // /api/plugin/<ctx.pluginId> - base for your own routes
  //   ctx.routeUrl // (path) => /api/plugin/<ctx.pluginId>/<path>
  //   ctx.dir      // absolute path to plugin folder (do NOT derive route IDs from it)
  //   ctx.readFile // async file reader
  // },

  async intercept(query: string, context: {
    fetch: typeof fetch
  }): Promise<{ query: string; overrides?: { searchType?: string; lang?: string; timeFilter?: string } }> {
    // transform the query, and optionally override search params
    return { query }
  },
}
`

export const generatePluginIntercept = async (ctx: GeneratorCtx) =>
  scaffoldDir(ctx.outDir, ctx.name, {
    "index.ts": indexTpl(ctx.name),
    "README.md": readmeTpl(ctx.name, "A query interceptor plugin that transforms search queries before they are processed."),
    "author.json": authorJsonTpl(ctx.config),
  })
