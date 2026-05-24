import { scaffoldDir, authorJsonTpl, readmeTpl } from "../utils/files.ts"
import type { GeneratorCtx } from "../types/index.ts"

const indexTpl = (name: string) => `export const interceptor = {
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
  }): Promise<{ query: string }> {
    // transform and return the modified query
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
