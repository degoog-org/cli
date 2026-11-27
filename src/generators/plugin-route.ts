import { scaffoldDir, authorJsonTpl, readmeTpl } from "../utils/files"
import type { GeneratorCtx } from "../types"

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
    async handler(req: Request, context: { authenticated: boolean }): Promise<Response> {
      return Response.json({ ok: true, authenticated: context.authenticated })
    },
  },
  {
    method: "get" as const,
    path: "/private",
    auth: true,
    async handler(req: Request): Promise<Response> {
      return Response.json({ ok: true })
    },
  },
]
`

export const generatePluginRoute = async (ctx: GeneratorCtx) =>
  scaffoldDir(ctx.outDir, ctx.name, {
    "index.ts": indexTpl(),
    "README.md": readmeTpl(ctx.name, "A plugin routes extension. Exposes custom HTTP endpoints at `/api/plugin/<pluginId>/`. Use `__PLUGIN_ID__` in frontend scripts and `ctx.apiBase` / `ctx.routeUrl()` in backend code to reference the installed plugin ID. Routes with `auth: true` answer 401 to anyone not signed in to degoog settings, and every handler gets `{ authenticated }` as its second argument."),
    "author.json": authorJsonTpl(ctx.config),
  })
