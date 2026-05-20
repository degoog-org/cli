import { readFile, writeFile, mkdir } from "node:fs/promises"
import { join, dirname } from "node:path"
import { homedir } from "node:os"
import { logger } from "../utils/logger.ts"
import type { Config } from "../types/index.ts"

const CONFIG_BASE = process.env.DEGOOG_CONFIG_HOME ?? join(homedir(), ".config", "degoog")
const CONFIG_PATH = join(CONFIG_BASE, "config.json")

export const loadConfig = async (): Promise<Config> => {
  try {
    const raw = await readFile(CONFIG_PATH, "utf8")
    return JSON.parse(raw) as Config
  } catch {
    return {}
  }
}

export const saveConfig = async (cfg: Config): Promise<void> => {
  try {
    await mkdir(dirname(CONFIG_PATH), { recursive: true })
    await writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf8")
  } catch (err) {
    logger.error(`failed to save config: ${String(err)}`)
    throw err
  }
}
