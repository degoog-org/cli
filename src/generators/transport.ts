import { scaffoldDir, authorJsonTpl, readmeTpl } from "../utils/files.ts"
import type { GeneratorCtx } from "../types/index.ts"

const indexTpl = (name: string) => `export const name = "${name}"
export const displayName = "${name}"
export const description = "Custom transport for degoog"

// settingsSchema example:
// export const settingsSchema = [
//   { key: "proxyUrl", label: "Proxy URL", type: "url", required: true },
// ]
//
// export const configure = (settings) => {
//   // called after settings save and on server restart
// }

export const available = async (): Promise<boolean> => {
  // return true if this transport is ready to use
  return true
}

export const fetch = async (
  url: string,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: string
    redirect?: RequestRedirect
    signal?: AbortSignal
  },
  context: {
    proxyUrl?: string
    fetch: typeof globalThis.fetch
  }
): Promise<Response> => {
  // TODO: implement transport logic
  return context.fetch(url, options)
}
`

export const generateTransport = async (ctx: GeneratorCtx) =>
  scaffoldDir(ctx.outDir, ctx.name, {
    "index.ts": indexTpl(ctx.name),
    "README.md": readmeTpl(ctx.name, "A custom HTTP transport for degoog."),
    "author.json": authorJsonTpl(ctx.config),
  })
