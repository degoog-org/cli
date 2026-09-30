import * as p from "@clack/prompts";
import { join } from "node:path";
import { ExtType, type GeneratorCtx } from "../types";
import { promptExtType } from "../prompts/ext-type";
import { generateEngine } from "../generators/engine";
import { generateTransport } from "../generators/transport";
import { generateAutocomplete } from "../generators/autocomplete";
import { generateFavicon } from "../generators/favicon";
import { generateTheme, THEME_PARTS } from "../generators/theme";
import { generatePluginBang } from "../generators/plugin-bang";
import { generatePluginSlot } from "../generators/plugin-slot";
import { generatePluginTab } from "../generators/plugin-tab";
import { generatePluginIntercept } from "../generators/plugin-intercept";
import { generatePluginMid } from "../generators/plugin-mid";
import { generatePluginRoute } from "../generators/plugin-route";
import { loadConfig } from "../config/store";
import { argv } from "../utils/argv";
import {
  extTypeToCategory,
  findStoreRoot,
  registerExtensionInStore,
  scaffoldStore,
} from "../utils/store";
import { t } from "../utils/theme";
import { ui } from "../utils/ui";
import { isHeadless, fail } from "../utils/headless";

const SLUG_RE = /^[a-z][a-z0-9-]*$/;

const VALID_TYPES = Object.values(ExtType) as string[]

const GENERATORS: Record<ExtType, (ctx: GeneratorCtx) => Promise<string>> = {
  [ExtType.Engine]: generateEngine,
  [ExtType.Transport]: generateTransport,
  [ExtType.Autocomplete]: generateAutocomplete,
  [ExtType.Favicon]: generateFavicon,
  [ExtType.Theme]: generateTheme,
  [ExtType.PluginBang]: generatePluginBang,
  [ExtType.PluginSlot]: generatePluginSlot,
  [ExtType.PluginTab]: generatePluginTab,
  [ExtType.PluginIntercept]: generatePluginIntercept,
  [ExtType.PluginMiddleware]: generatePluginMid,
  [ExtType.PluginRoutes]: generatePluginRoute,
};

const resolveOutDir = async (
  extType: ExtType,
  config: Awaited<ReturnType<typeof loadConfig>>,
): Promise<string | null> => {
  if (argv.out) return argv.out;

  const category = extTypeToCategory(extType);
  let store = await findStoreRoot(process.cwd());

  if (store) {
    ui.info(t.muted(`store detected — creating in ${category}/`));
    return join(store.dir, category);
  }

  if (isHeadless && !argv.initStore) return ".";

  const setup = argv.initStore || await p.confirm({
    message: "No store detected. Set up a store in the current directory?",
    initialValue: true,
  });
  if (p.isCancel(setup)) return null;

  if (setup) {
    await scaffoldStore(process.cwd(), config);
    store = await findStoreRoot(process.cwd());
    if (store) {
      ui.info(t.muted(`store created — creating in ${category}/`));
      return join(store.dir, category);
    }
  }

  const input = await p.text({
    message: "Output directory",
    placeholder: ".",
  });
  if (p.isCancel(input)) return null;
  return input || ".";
};

const parseThemeParts = (): string[] | undefined => {
  if (argv.include === undefined) return undefined
  const parts = argv.include.split(",").map((s) => s.trim()).filter(Boolean)
  if (parts.includes("all")) return THEME_PARTS
  const unknown = parts.filter((s) => !THEME_PARTS.includes(s))
  if (unknown.length) {
    fail(`unknown --include value(s): ${unknown.join(", ")}. Valid: all, ${THEME_PARTS.join(", ")}`)
  }
  return parts
}

const askConfirm = async (
  preset: boolean | undefined,
  message: string,
): Promise<boolean | null> => {
  if (preset !== undefined) return preset
  if (isHeadless) return false
  const picked = await p.confirm({ message, initialValue: false })
  if (p.isCancel(picked)) return null
  return picked
}

export const createCmd = async () => {
  let name: string

  if (argv.name && SLUG_RE.test(argv.name)) {
    name = argv.name
  } else if (isHeadless) {
    return fail(argv.name
      ? `invalid --name "${argv.name}": lowercase letters, numbers and hyphens only`
      : "--name is required when running without a terminal")
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
  } else if (isHeadless) {
    return fail(`${argv.type ? `invalid --type "${argv.type}"` : "--type is required when running without a terminal"}. Valid: ${VALID_TYPES.join(", ")}`)
  } else {
    const picked = await promptExtType()
    if (!picked) return
    extType = picked
  }

  let challenges = false
  let handlesChallenges = false

  if (extType === ExtType.Engine) {
    const picked = await askConfirm(
      argv.challenges,
      "Does the site put an Anubis proof-of-work page in front of its results?",
    )
    if (picked === null) return
    challenges = picked
  }

  if (extType === ExtType.Transport) {
    const picked = await askConfirm(
      argv.handlesChallenges,
      "Does this transport drive a real browser that gets through proof-of-work pages?",
    )
    if (picked === null) return
    handlesChallenges = picked
  }

  const themeParts = extType === ExtType.Theme ? parseThemeParts() : undefined

  const config = await loadConfig()
  const outDir = await resolveOutDir(extType, config)
  if (!outDir) return

  const ctx: GeneratorCtx = { name, outDir, config, challenges, handlesChallenges }
  if (themeParts) ctx.themeParts = themeParts

  const createdPath = await GENERATORS[extType](ctx)

  const store = await findStoreRoot(createdPath)
  if (store) {
    await registerExtensionInStore(store.dir, name, extType, challenges)
  }

  ui.note(
    `That's it, you now have a sexy template for your extension. Have fun making it your own!`,
    "done",
  )
}
