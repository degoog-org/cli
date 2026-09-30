import { scaffoldDir, authorJsonTpl, readmeTpl } from "../utils/files"
import type { GeneratorCtx } from "../types"

const indexTpl = (name: string) => `export const transport = {
  name: "${name}",
  displayName: "${name}",
  description: "Custom transport for degoog",

  // settingsSchema: [
  //   { key: "proxyUrl", label: "Proxy URL", type: "url", required: true },
  // ],
  //
  // configure(settings) {
  //   // called after settings save and on server restart
  // },
  //
  // needsAppRestart: true, // set true if this transport needs a server restart to work (e.g. registers a WebSocket route)

  async available(): Promise<boolean> {
    // return true if this transport is ready to use
    return true
  },

  async fetch(
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
  ): Promise<Response> {
    // TODO: implement transport logic
    return context.fetch(url, options)
  },
}
`

export const generateTransport = async (ctx: GeneratorCtx) =>
  scaffoldDir(ctx.outDir, ctx.name, {
    "index.ts": indexTpl(ctx.name),
    "README.md": readmeTpl(ctx.name, "A custom HTTP transport for degoog."),
    "author.json": authorJsonTpl(ctx.config),
  })
