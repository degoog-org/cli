import { scaffoldDir, authorJsonTpl, readmeTpl } from "../utils/files"
import type { GeneratorCtx } from "../types"

const indexTpl = (name: string) => `type RichSuggestion = {
  description?: string
  thumbnail?: string
  type?: string
}

type Suggestion = string | { text: string; rich?: RichSuggestion }

export const provider = {
  name: "${name}",

  // settingsSchema: [
  //   { key: "endpoint", label: "Endpoint URL", type: "url", required: true },
  // ],
  //
  // configure(settings) {},
  //
  // needsAppRestart: true, // set true if this autocomplete provider needs a server restart to work (e.g. registers a WebSocket route)

  async getSuggestions(
    query: string,
    context: {
      fetch: typeof fetch
      lang: string
    }
  ): Promise<Suggestion[]> {
    // TODO: implement autocomplete logic
    // use context.fetch instead of global fetch
    return []
  },
}
`

export const generateAutocomplete = async (ctx: GeneratorCtx) =>
  scaffoldDir(ctx.outDir, ctx.name, {
    "index.ts": indexTpl(ctx.name),
    "README.md": readmeTpl(ctx.name, "A custom autocomplete provider for degoog."),
    "author.json": authorJsonTpl(ctx.config),
  })
