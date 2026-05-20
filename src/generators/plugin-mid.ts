import { scaffoldDir, authorJsonTpl, readmeTpl } from "../utils/files.ts"
import type { GeneratorCtx } from "../types/index.ts"

const indexTpl = (name: string) => `export const middleware = {
  id: "${name}",
  name: "${name}",

  async handle(req: Request, context: {
    fetch: typeof fetch
  }): Promise<Response | { redirect: string } | null> {
    // return a Response to intercept, { redirect: "/url" } to redirect,
    // or null to pass through
    return null
  },
}
`

export const generatePluginMid = async (ctx: GeneratorCtx) =>
  scaffoldDir(ctx.outDir, ctx.name, {
    "index.ts": indexTpl(ctx.name),
    "README.md": readmeTpl(ctx.name, "A request middleware plugin that hooks into degoog request flows."),
    "author.json": authorJsonTpl(ctx.config),
  })
