import * as p from "@clack/prompts"
import { loadConfig, saveConfig } from "../config/store.ts"
import { logger } from "../utils/logger.ts"
import type { Config } from "../types/index.ts"

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

export const loginCmd = async () => {
  const existing = await loadConfig()

  const instanceUrl = await p.text({
    message: "degoog instance URL",
    placeholder: "http://localhost:4444",
    initialValue: existing.instanceUrl ?? "",
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
    initialValue: existing.username ?? "",
  })
  if (p.isCancel(username)) return

  const website = await p.text({
    message: "Your website or GitHub URL (optional)",
    placeholder: "https://github.com/username",
    initialValue: existing.website ?? "",
    validate: isValidUrl,
  })
  if (p.isCancel(website)) return

  const cfg: Config = { ...existing }
  if (instanceUrl) cfg.instanceUrl = instanceUrl
  if (apiKey) cfg.apiKey = apiKey
  if (username) cfg.username = username
  if (website) cfg.website = website
  else if (!website && existing.website) cfg.website = existing.website

  await saveConfig(cfg)
  logger.success("config saved")
}
