import { scaffoldDir, authorJsonTpl, readmeTpl } from "../utils/files.ts"
import type { GeneratorCtx } from "../types/index.ts"

const indexTpl = (name: string) => `// If this file also exports other hooks (slot, interceptor, tab, etc.) and
// you want a single settings card for all of them, add a top-level plugin identity:
//
// export const plugin = {
//   id: "${name}",
//   name: "${name}",
//   description: "...",
//   settingsSchema: [ /* shared fields */ ],
// };
//
// All hooks in this file will share that id and appear as one card in settings.

export default {
  name: "${name}",
  description: "${name} bang command",
  trigger: "${name}",

  /**
   * Set to true if your execute() returns HTML that causes the browser
   * to fetch external URLs (images, scripts, etc.).
   * Set to false if all network access goes through context.fetch / signProxyUrl.
   * Leaving this unset shows an ambiguous badge in the degoog settings page.
   */
  isClientExposed: false,

  // aliases: ["${name}2"],
  // naturalLanguagePhrases: ["do something with"],

  // settingsSchema: [
  //   { key: "apiKey", label: "API Key", type: "password", required: true },
  //   // A "list" field lets users manage a repeatable list of structured rows.
  //   // The value arrives in configure() as a JSON array string; JSON.parse it.
  //   // {
  //   //   key: "bangs", label: "Custom bangs", type: "list", addLabel: "+ Add bang",
  //   //   itemSchema: [
  //   //     { key: "shortcut", label: "Shortcut", type: "text" },
  //   //     // URL templates can use {{{s}}} or %s where the query goes.
  //   //     { key: "url", label: "URL template", type: "text" },
  //   //     { key: "openBase", label: "Open base path", type: "toggle" },
  //   //   ],
  //   // },
  // ],
  //
  // configure(settings) {},
  //
  // async init(ctx) {
  //   ctx.template // template.html contents
  //   ctx.pluginId // installed plugin folder ID assigned by degoog (alias: ctx.id)
  //   ctx.apiBase  // /api/plugin/<ctx.pluginId> - base for your own routes
  //   ctx.routeUrl // (path) => /api/plugin/<ctx.pluginId>/<path>
  //   ctx.dir      // absolute path to plugin folder (do NOT derive route IDs from it)
  //   ctx.readFile // async file reader
  // },

  async execute(args: string, context: {
    template: string
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
      title: "${name}",
      html: context.template || "<p>Result goes here</p>",
      // totalPages: 1,
    }
  },
}
`

export const generatePluginBang = async (ctx: GeneratorCtx) =>
  scaffoldDir(ctx.outDir, ctx.name, {
    "index.ts": indexTpl(ctx.name),
    "template.html": "",
    "README.md": readmeTpl(ctx.name, `A bang command plugin. Trigger with \`!${ctx.name} <query>\`.`),
    "author.json": authorJsonTpl(ctx.config),
  })
