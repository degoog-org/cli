import { scaffoldDir, authorJsonTpl, readmeTpl } from "../utils/files"
import type { GeneratorCtx } from "../types"

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
// Every hook in this file then shares that id and shows as one card in settings.

export const interceptor = {
  name: "${name}",
  description: "Modifies queries before search",

  // settingsSchema: [
  //   { key: "mode", label: "Mode", type: "select", options: ["simple", "custom"], default: "simple" },
  //   // visibleWhen shows a field only while another field holds a value.
  //   // equals takes one value or an array of them. In an array of rules, every rule must match.
  //   { key: "customUrl", label: "Custom URL", type: "url", visibleWhen: { key: "mode", equals: "custom" } },
  // ],
  //
  // configure(settings) {},
  // needsAppRestart: true, // set true if this interceptor needs a server restart to work (e.g. registers a WebSocket route)
  //
  // async init(ctx) {
  //   ctx.pluginId // installed plugin folder ID assigned by degoog (alias: ctx.id)
  //   ctx.apiBase  // /api/plugin/<ctx.pluginId>, the base for your own routes
  //   ctx.routeUrl // (path) => /api/plugin/<ctx.pluginId>/<path>
  //   ctx.dir      // absolute path to plugin folder (do NOT derive route IDs from it)
  //   ctx.readFile // async file reader
  //   ctx.signProxyUrl   // (url) => signed /api/proxy/image URL for an external image
  //   ctx.signFaviconUrl // (url) => signed /api/proxy/favicon URL for the url's host, "" when no favicon provider is enabled
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
    "README.md": readmeTpl(ctx.name, "A query interceptor plugin that transforms search queries before degoog runs them."),
    "author.json": authorJsonTpl(ctx.config),
  })
