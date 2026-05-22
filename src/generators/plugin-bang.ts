import { scaffoldDir, authorJsonTpl, readmeTpl } from "../utils/files.ts"
import type { GeneratorCtx } from "../types/index.ts"

const indexTpl = (name: string) => `export default {
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
  // ],
  //
  // configure(settings) {},
  //
  // async init(ctx) {
  //   ctx.template // template.html contents
  //   ctx.dir      // absolute path to plugin folder
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
