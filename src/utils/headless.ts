import { argv } from "./argv"
import { logger } from "./logger"

const envFlag = (name: string): boolean => {
  const v = process.env[name]
  return !!v && !["0", "false", "no", "off"].includes(v.toLowerCase())
}

export const isHeadless =
  argv.headless ||
  envFlag("DEGOOG_HEADLESS") ||
  envFlag("CI") ||
  !process.stdin.isTTY ||
  !process.stdout.isTTY

export const fail = (msg: string): never => {
  logger.error(msg)
  process.exit(1)
}
