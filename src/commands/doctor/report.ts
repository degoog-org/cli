import { t } from "../../utils/theme.ts"
import type { CheckResult, CheckStatus } from "./types.ts"

const PASS = t.success("PASS")
const FAIL = t.danger("FAIL")
const WARN = t.warning("WARN")
const FIX = t.success("FIX ")

const statusIcon = (s: CheckStatus): string => {
  if (s === "pass") return PASS
  if (s === "fail") return FAIL
  if (s === "warn") return WARN
  return FIX
}

export const printResults = (results: CheckResult[]): void => {
  for (const r of results) {
    const icon = statusIcon(r.status)
    const detail = r.detail ? t.muted(` - ${r.detail}`) : ""
    console.log(`  ${icon}  ${r.label}${detail}`)
  }
}
