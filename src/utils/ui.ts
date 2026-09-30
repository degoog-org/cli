import * as p from "@clack/prompts"
import { isHeadless } from "./headless"

type Spinner = {
  start: (msg?: string) => void
  stop: (msg?: string) => void
}

const silentSpinner: Spinner = {
  start: () => {},
  stop: () => {},
}

export const ui = {
  intro: (msg: string) => {
    if (!isHeadless) p.intro(msg)
  },
  outro: (msg: string) => {
    if (isHeadless) console.log(msg)
    else p.outro(msg)
  },
  info: (msg: string) => {
    if (isHeadless) console.log(msg)
    else p.log.info(msg)
  },
  step: (msg: string) => {
    if (isHeadless) console.log(msg)
    else p.log.step(msg)
  },
  warn: (msg: string) => {
    if (isHeadless) console.warn(msg)
    else p.log.warn(msg)
  },
  note: (msg: string, title?: string) => {
    if (isHeadless) console.log(msg)
    else p.note(msg, title)
  },
  spinner: (): Spinner => (isHeadless ? silentSpinner : p.spinner()),
}
