import { scaffoldDir, authorJsonTpl, readmeTpl } from "../utils/files.ts"
import type { GeneratorCtx } from "../types/index.ts"

const indexTpl = (name: string) => `export const name = "${name}"
export const type = "web" // web | images | videos | news | custom
export const bangShortcut = "${name}"

// settingsSchema example:
// export const settingsSchema = [
//   { key: "apiKey", label: "API Key", type: "password", required: true },
// ]
//
// export const configure = (settings) => {
//   // called after settings save and on server restart
// }

export const executeSearch = async (
  query: string,
  page = 1,
  timeFilter: string,
  context: {
    lang: string
    fetch: typeof fetch
    signProxyUrl: (url: string) => string
    buildAcceptLanguage: () => string
    dateFrom?: string
    dateTo?: string
  }
) => {
  const results: Array<{
    title: string
    url: string
    snippet: string
    source: string
    thumbnail?: string
  }> = []

  // TODO: implement search logic
  // use context.fetch instead of global fetch

  return results
}
`

export const generateEngine = async (ctx: GeneratorCtx) =>
  scaffoldDir(ctx.outDir, ctx.name, {
    "index.ts": indexTpl(ctx.name),
    "README.md": readmeTpl(ctx.name, "A custom search engine for degoog."),
    "author.json": authorJsonTpl(ctx.config),
  })
