const fg = (r: number, g: number, b: number) => `\x1b[38;2;${r};${g};${b}m`
const RESET = "\x1b[0m"
const BOLD = "\x1b[1m"
const DIM = "\x1b[2m"

const c = {
  primary:   fg(86,  115, 172),
  brand:     fg(66,  133, 244),
  textPrim:  fg(221, 221, 221),
  textSec:   fg(154, 160, 166),
  success:   fg(52,  168, 83),
  warning:   fg(251, 188, 5),
  danger:    fg(234, 67,  53),
}

export const t = {
  primary:   (s: string) => `${c.primary}${s}${RESET}`,
  brand:     (s: string) => `${c.brand}${s}${RESET}`,
  muted:     (s: string) => `${c.textSec}${s}${RESET}`,
  text:      (s: string) => `${c.textPrim}${s}${RESET}`,
  success:   (s: string) => `${c.success}${s}${RESET}`,
  warning:   (s: string) => `${c.warning}${s}${RESET}`,
  danger:    (s: string) => `${c.danger}${s}${RESET}`,
  bold:      (s: string) => `${BOLD}${s}${RESET}`,
  dim:       (s: string) => `${DIM}${s}${RESET}`,
}

const logo =
  `${c.brand}D${RESET}` +
  `${c.danger}E${RESET}` +
  `${c.warning}G${RESET}` +
  `${c.brand}O${RESET}` +
  `${c.success}O${RESET}` +
  `${c.danger}G${RESET}`

export const title = `${logo} ${BOLD}${c.primary}CLI${RESET}`
