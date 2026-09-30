import * as p from "@clack/prompts"
import { loadConfig, saveConfig } from "../config/store"
import { logger } from "../utils/logger"
import { argv } from "../utils/argv"
import { isHeadless, fail } from "../utils/headless"
import type { Config } from "../types"

const isValidUrl = (val: string) => {
  if (!val) return undefined
  try {
    const u = new URL(val)
    if (u.protocol !== "http:" && u.protocol !== "https:") return "Must be http or https"
    return undefined
  } catch {
    return "Invalid URL"
  }
}

const loginHeadless = async (existing: Config) => {
  const instanceUrl = argv.instanceUrl ?? process.env.DEGOOG_INSTANCE_URL
  const apiKey = argv.apiKey ?? process.env.DEGOOG_API_KEY
  const username = argv.username
  const website = argv.website

  if (!instanceUrl && !apiKey && !username && !website) {
    return fail("nothing to save, pass at least one of --instance-url, --api-key, --username, --website")
  }

  for (const [flag, val] of [["--instance-url", instanceUrl], ["--website", website]] as const) {
    const err = val ? isValidUrl(val) : undefined
    if (err) return fail(`${flag}: ${err}`)
  }

  const cfg: Config = { ...existing }
  if (instanceUrl) cfg.instanceUrl = instanceUrl
  if (apiKey) cfg.apiKey = apiKey
  if (username) cfg.username = username
  if (website) cfg.website = website

  await saveConfig(cfg)
  logger.success("config saved")
}

export const loginCmd = async () => {
  const existing = await loadConfig()

  if (isHeadless) return loginHeadless(existing)

  const instanceUrl = await p.text({
    message: "degoog instance URL",
    placeholder: "http://localhost:4444",
    initialValue: argv.instanceUrl ?? existing.instanceUrl ?? "",
    validate: isValidUrl,
  })
  if (p.isCancel(instanceUrl)) return

  const maskKey = (k: string) =>
    k.length <= 8 ? "••••••••" : k.slice(0, 4) + "••••••••" + k.slice(-4)
  const apiKeyHint = existing.apiKey
    ? ` (${maskKey(existing.apiKey)}, leave blank to keep)`
    : " (leave blank to skip)"
  const apiKey = await p.password({
    message: `API key${apiKeyHint}`,
  })
  if (p.isCancel(apiKey)) return

  const username = await p.text({
    message: "Your name (used in author.json when scaffolding extensions)",
    placeholder: "Jane Dev",
    initialValue: argv.username ?? existing.username ?? "",
  })
  if (p.isCancel(username)) return

  const website = await p.text({
    message: "Your website or GitHub URL (optional)",
    placeholder: "https://github.com/username",
    initialValue: argv.website ?? existing.website ?? "",
    validate: isValidUrl,
  })
  if (p.isCancel(website)) return

  const cfg: Config = { ...existing }
  if (instanceUrl) cfg.instanceUrl = instanceUrl
  const key = apiKey || argv.apiKey
  if (key) cfg.apiKey = key
  if (username) cfg.username = username
  if (website) cfg.website = website
  else if (!website && existing.website) cfg.website = existing.website

  await saveConfig(cfg)
  logger.success("config saved")
}
