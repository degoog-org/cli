import { scaffoldDir, authorJsonTpl, readmeTpl } from "../utils/files.ts"
import type { GeneratorCtx } from "../types/index.ts"

const indexTpl = () => `// Routes are served at /api/plugin/<pluginId>/<path>, where <pluginId> is the
// installed folder ID assigned by degoog (e.g. <author>-<repo>-<plugin>). Never
// hardcode that ID. The "path" below is only the suffix after the plugin ID.
//
// To link to your own routes:
//   - frontend (script.js): use the injected __PLUGIN_ID__ constant
//       fetch(\`/api/plugin/\${__PLUGIN_ID__}/hello\`)
//   - backend (index.ts): stash ctx.apiBase / ctx.routeUrl from init(ctx)
//       let apiBase = ""
//       export const init = (ctx) => { apiBase = ctx.apiBase }
//       // then build URLs as \`\${apiBase}/hello\` or ctx.routeUrl("hello")
export const routes = [
  {
    method: "get" as const,
    path: "/hello",
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
    "index.ts": indexTpl(),
    "README.md": readmeTpl(ctx.name, "A plugin routes extension. Exposes custom HTTP endpoints at `/api/plugin/<pluginId>/`. Use `__PLUGIN_ID__` in frontend scripts and `ctx.apiBase` / `ctx.routeUrl()` in backend code to reference the installed plugin ID."),
    "author.json": authorJsonTpl(ctx.config),
  })
