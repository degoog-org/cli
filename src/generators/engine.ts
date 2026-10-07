import { scaffoldDir, authorJsonTpl, readmeTpl } from "../utils/files";
import type { GeneratorCtx } from "../types";

const indexTpl = (name: string, challenges: boolean) => `export const type = "web" // string or array - e.g. "web", "books", ["web", "any-type"]

// filters example (image engines only):
// Declare which image filter groups/values this engine supports.
// degoog builds the image filter bar from the union of every enabled image
// engine's filters, so only declare values you translate below.
// "transparent" can sit under "color" or "type". Put it wherever your engine
// implements it and degoog shows it there.
//
// export const filters = {
//   size: ["small", "medium", "large", "wallpaper"],
//   color: ["red", "blue", "green", "transparent"],
//   type: ["photo", "clipart", "lineart", "animated"],
//   layout: ["square", "wide", "tall"],
//   nsfw: ["on", "moderate", "off"],
// }
//
// The selected values arrive on context.imageFilter, e.g.
// context.imageFilter = { color: "red", nsfw: "moderate" }

export const engine = {
  name: "${name}",
  bangShortcut: "${name}",
${challenges ? `  challenges: ["anubis"],\n` : ""}
  // settingsSchema: [
  //   { key: "plan", label: "Plan", type: "select", options: ["free", "paid"], default: "free" },
  //   // Shown and required only while plan is "paid". equals also takes an array.
  //   { key: "apiKey", label: "API Key", type: "password", required: true, visibleWhen: { key: "plan", equals: "paid" } },
  // ],
  //
  // configure(settings) {
  //   // called after settings save and on server restart
  // },
  //
  // needsAppRestart: true, // set true if this engine needs a server restart to work (e.g. registers a WebSocket route)

  async executeSearch(
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
      imageFilter?: Record<string, string>
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
  ) {
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
      context?.sentinel?.(response, "${name}")
      const data = await response.json()
      // TODO: map data into results
      return results
    } catch (e: any) {
      if (e?.name === "SentinelBreach") throw e
      return []
    }
  }
}
`;

export const generateEngine = async (ctx: GeneratorCtx) =>
  scaffoldDir(ctx.outDir, ctx.name, {
    "index.ts": indexTpl(ctx.name, ctx.challenges ?? false),
    "README.md": readmeTpl(ctx.name, "A custom search engine for degoog."),
    "author.json": authorJsonTpl(ctx.config),
  });
