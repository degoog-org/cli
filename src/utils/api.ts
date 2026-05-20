import type { Config } from "../types/index.ts"
import { logger } from "./logger.ts"

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string }

export const apiGet = async <T>(
  config: Config,
  path: string
): Promise<ApiResult<T>> => {
  const headers: Record<string, string> = {}
  if (config.apiKey) headers["Authorization"] = `Bearer ${config.apiKey}`

  try {
    const res = await fetch(`${config.instanceUrl}${path}`, { headers })
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string }
      return { ok: false, status: res.status, error: body.error ?? `HTTP ${res.status}` }
    }
    return { ok: true, data: await res.json() as T }
  } catch (err) {
    logger.error(`api request failed: ${String(err)}`)
    return { ok: false, status: 0, error: "connection failed" }
  }
}
