import { scaffoldDir, authorJsonTpl, readmeTpl } from "../utils/files.ts"
import type { GeneratorCtx } from "../types/index.ts"

const indexTpl = (name: string) => `// If this file also exports other hooks (slot, interceptor, command, etc.) and
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

export const middleware = {
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
