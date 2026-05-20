import * as p from "@clack/prompts";
import { ExtType, type GeneratorCtx } from "../types/index.ts";
import { promptExtType } from "../prompts/ext-type.ts";
import { generateEngine } from "../generators/engine.ts";
import { generateTransport } from "../generators/transport.ts";
import { generateAutocomplete } from "../generators/autocomplete.ts";
import { generateTheme } from "../generators/theme.ts";
import { generatePluginBang } from "../generators/plugin-bang.ts";
import { generatePluginSlot } from "../generators/plugin-slot.ts";
import { generatePluginTab } from "../generators/plugin-tab.ts";
import { generatePluginIntercept } from "../generators/plugin-intercept.ts";
import { generatePluginMid } from "../generators/plugin-mid.ts";
import { generatePluginRoute } from "../generators/plugin-route.ts";
import { loadConfig } from "../config/store.ts";
import { argv } from "../utils/argv.ts";

const SLUG_RE = /^[a-z][a-z0-9-]*$/;

const VALID_TYPES = Object.values(ExtType) as string[]

const GENERATORS: Record<ExtType, (ctx: GeneratorCtx) => Promise<string>> = {
  [ExtType.Engine]: generateEngine,
  [ExtType.Transport]: generateTransport,
  [ExtType.Autocomplete]: generateAutocomplete,
  [ExtType.Theme]: generateTheme,
  [ExtType.PluginBang]: generatePluginBang,
  [ExtType.PluginSlot]: generatePluginSlot,
  [ExtType.PluginTab]: generatePluginTab,
  [ExtType.PluginIntercept]: generatePluginIntercept,
  [ExtType.PluginMiddleware]: generatePluginMid,
  [ExtType.PluginRoutes]: generatePluginRoute,
};

export const createCmd = async () => {
  let name: string

  if (argv.name && SLUG_RE.test(argv.name)) {
    name = argv.name
  } else {
    const input = await p.text({
      message: "Extension name",
      placeholder: "my-extension",
      initialValue: argv.name ?? "",
      validate: (v) => {
        if (!v) return "Name is required"
        if (!SLUG_RE.test(v)) return "Lowercase letters, numbers and hyphens only"
      },
    })
    if (p.isCancel(input)) return
    name = input
  }

  let extType: ExtType

  if (argv.type && VALID_TYPES.includes(argv.type)) {
    extType = argv.type as ExtType
  } else {
    const picked = await promptExtType()
    if (!picked) return
    extType = picked
  }

  let outDir: string

  if (argv.out) {
    outDir = argv.out
  } else {
    const input = await p.text({
      message: "Output directory",
      initialValue: ".",
    })
    if (p.isCancel(input)) return
    outDir = input || "."
  }

  const config = await loadConfig()
  const ctx: GeneratorCtx = { name, outDir, config }

  await GENERATORS[extType](ctx)

  p.note(
    `That's it, you now have a sexy template for your extension. Have fun making it your own!`,
    "done",
  )
}
