import { t } from "./theme.ts"

export const logger = {
  info:    (msg: string) => console.log(`${t.muted("info")}  ${msg}`),
  success: (msg: string) => console.log(`${t.success("ok")}    ${msg}`),
  warn:    (msg: string) => console.warn(`${t.warning("warn")}  ${msg}`),
  error:   (msg: string) => console.error(`${t.danger("error")} ${msg}`),
}
