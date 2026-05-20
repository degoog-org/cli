import { scaffoldDir, authorJsonTpl, readmeTpl } from "../utils/files.ts"
import type { GeneratorCtx } from "../types/index.ts"

const indexTpl = (name: string) => `export const name = "${name}"

// settingsSchema example:
// export const settingsSchema = [
//   { key: "endpoint", label: "Endpoint URL", type: "url", required: true },
// ]
//
// export const configure = (settings) => {}

type RichSuggestion = {
  description?: string
  thumbnail?: string
  type?: string
}

type Suggestion = string | { text: string; rich?: RichSuggestion }

export const getSuggestions = async (
  query: string,
  context: {
    fetch: typeof fetch
    lang: string
    createCache: <T>(ttlMs: number) => {
      get: (key: string) => T | undefined
      set: (key: string, value: T) => void
      clear: () => void
    }
  }
): Promise<Suggestion[]> => {
  // TODO: implement autocomplete logic
  // use context.fetch instead of global fetch
  return []
}
`

export const generateAutocomplete = async (ctx: GeneratorCtx) =>
  scaffoldDir(ctx.outDir, ctx.name, {
    "index.ts": indexTpl(ctx.name),
    "README.md": readmeTpl(ctx.name, "A custom autocomplete provider for degoog."),
    "author.json": authorJsonTpl(ctx.config),
  })
