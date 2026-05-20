import { scaffoldDir, authorJsonTpl, readmeTpl } from "../utils/files.ts"
import type { GeneratorCtx } from "../types/index.ts"

const indexTpl = (name: string) => `// routes are served at /plugin-routes/<path>
export const routes = [
  {
    method: "get" as const,
    path: "/${name}/hello",
    async handler(req: Request): Promise<Response> {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      })
    },
  },
]
`

export const generatePluginRoute = async (ctx: GeneratorCtx) =>
  scaffoldDir(ctx.outDir, ctx.name, {
    "index.ts": indexTpl(ctx.name),
    "README.md": readmeTpl(ctx.name, `A plugin routes extension. Exposes custom HTTP endpoints at \`/plugin-routes/${ctx.name}/\`.`),
    "author.json": authorJsonTpl(ctx.config),
  })
