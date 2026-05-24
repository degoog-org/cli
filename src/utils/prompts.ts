import * as p from "@clack/prompts"
import { t } from "./theme.ts"

const exitCancelled = (): never => {
  p.cancel(t.muted("cancelled"))
  process.exit(0)
}

type TextOpts = {
  message: string
  defaultValue: string
  placeholder?: string
}

export const promptText = async (opts: TextOpts): Promise<string> => {
  const input = await p.text({
    message: opts.message,
    placeholder: opts.placeholder ?? opts.defaultValue,
  })
  if (p.isCancel(input)) exitCancelled()
  const str = typeof input === "string" ? input.trim() : ""
  return str || opts.defaultValue
}

export const promptConfirm = async (
  message: string,
  initialValue = false,
): Promise<boolean> => {
  const ans = await p.confirm({ message, initialValue })
  if (p.isCancel(ans)) exitCancelled()
  return ans === true
}

export const promptSelect = async <T extends string>(
  message: string,
  options: { value: T; label: string; hint?: string }[],
): Promise<T> => {
  const picked = await p.select<T>({ message, options })
  if (p.isCancel(picked)) exitCancelled()
  return picked as T
}
