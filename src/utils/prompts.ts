import * as p from "@clack/prompts"
import { t } from "./theme"
import { Option } from "@clack/prompts"
import { isHeadless, fail } from "./headless"

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
  if (isHeadless) return opts.defaultValue
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
  if (isHeadless) return initialValue
  const ans = await p.confirm({ message, initialValue })
  if (p.isCancel(ans)) exitCancelled()
  return ans === true
}

type SelectOption<T extends string> = {
  value: T
  label: string
}

export const promptSelect = async <T extends string>(
  message: string,
  options: SelectOption<T>[],
  headlessDefault?: T,
): Promise<T> => {
  if (isHeadless) {
    if (headlessDefault !== undefined) return headlessDefault
    return fail(`cannot answer "${message}" without a terminal, pass the matching flag`)
  }
  const picked = await p.select<T>({ message, options: options as Option<T>[] })
  if (p.isCancel(picked)) exitCancelled()
  return picked as T
}
