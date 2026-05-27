import { scaffoldDir, authorJsonTpl, readmeTpl } from "../utils/files.ts";
import type { GeneratorCtx } from "../types/index.ts";

const indexTpl = (name: string) => `export const name = "${name}"
export const type = "web" // string or array - e.g. "web", "books", ["web", "any-type"]
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
    sentinel?: (
      response: { ok: boolean; status: number },
      engineName?: string
    ) => void
    engineError?: (
      status: string,
      message: string,
      opts?: { httpStatus?: number; engine?: string }
    ) => Error
  }
) => {
  const results: Array<{
    title: string
    url: string
    snippet: string
    source: string
    thumbnail?: string
  }> = []

  try {
    const doFetch = context?.fetch ?? fetch
    const response = await doFetch(\`https://api.example.com/search?q=\${encodeURIComponent(query)}\`)
    context?.sentinel?.(response, name)
    const data = await response.json()
    // TODO: map data into results
    return results
  } catch (e: any) {
    if (e?.name === "SentinelBreach") throw e
    return []
  }
}
`;

export const generateEngine = async (ctx: GeneratorCtx) =>
  scaffoldDir(ctx.outDir, ctx.name, {
    "index.ts": indexTpl(ctx.name),
    "README.md": readmeTpl(ctx.name, "A custom search engine for degoog."),
    "author.json": authorJsonTpl(ctx.config),
  });
