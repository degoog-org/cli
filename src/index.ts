import * as p from "@clack/prompts"
import { loginCmd } from "./commands/login"
import { createCmd } from "./commands/create"
import { searchCmd } from "./commands/search"
import { doctorCmd } from "./commands/doctor"
import { title, t } from "./utils/theme"
import { checkLatest, VERSION, updateCmd } from "./utils/version"
import { argv } from "./utils/argv"
import { isHeadless } from "./utils/headless"
import { logger } from "./utils/logger"
import { THEME_PARTS } from "./generators/theme"
import { ExtType } from "./types"

const SUBCOMMANDS: Record<string, () => Promise<void>> = {
  create: async () => { await createCmd() },
  login:  async () => { await loginCmd() },
  search: async () => { await searchCmd() },
  doctor: async () => { await doctorCmd() },
}

const usage = () => `degoog-cli v${VERSION}

usage: degoog-cli [command] [options]

Run with no command in a terminal to get the interactive menu. Every command
also runs without prompts: pass -y/--yes, or pipe it, or set CI or DEGOOG_HEADLESS=1.

commands:
  create   scaffold a new extension
             --name <slug>            required without a terminal
             --type <type>            required without a terminal
                                      ${Object.values(ExtType).join(", ")}
             --out <dir>              output directory (default: store category, else .)
             --init-store             create a store in the current directory if none is found
             --challenges             engine: site uses an Anubis proof-of-work page
             --handles-challenges     transport: drives a real browser past proof-of-work pages
             --include <parts>        theme: comma-separated parts, or "all" (default: css)
                                      ${THEME_PARTS.join(", ")}
  search   search your instance
             <query>                  required without a terminal
             --json                   print raw JSON (implies no prompts)
             --limit <n>              only print the first n results
  login    save instance and author details
             --instance-url <url>     or DEGOOG_INSTANCE_URL
             --api-key <key>          or DEGOOG_API_KEY
             --username <name>
             --website <url>
  doctor   validate an extension folder or store
             [path]                   default: current directory
             --fix                    apply safe fixes, including registering orphan folders
             --plugin-type <type>     type used when registering orphan plugin folders

global:
  -y, --yes, --headless    never prompt, use flags and defaults
  --no-color               disable colours (also NO_COLOR, or when output is not a terminal)
  -h, --help               show this help
  -v, --version            print the version
`

const main = async () => {
  if (argv.help) {
    console.log(usage())
    process.exit(0)
  }
  if (argv.version) {
    console.log(VERSION)
    process.exit(0)
  }

  const sub = argv.command
  if (sub && sub in SUBCOMMANDS) {
    await SUBCOMMANDS[sub]!()
    process.exit(0)
  }
  if (sub) {
    logger.error(`unknown command: ${sub}`)
    console.log(usage())
    process.exit(1)
  }
  if (isHeadless) {
    console.log(usage())
    process.exit(1)
  }

  p.intro(title)

  const updateCheck = checkLatest()

  const newVersion = await Promise.race([
    updateCheck,
    new Promise<null>((res) => setTimeout(() => res(null), 2000)),
  ])

  while (true) {
    const options = [
      ...(newVersion ? [{ value: "update", label: t.warning(`Update to v${newVersion}`), hint: `you have v${VERSION}` }] : []),
      { value: "create", label: t.text("Create extension"), hint: "scaffold a new degoog extension" },
      { value: "search", label: t.text("Search"),           hint: "search your degoog instance from the terminal" },
      { value: "login",  label: t.text("Login / Setup"),    hint: "configure your instance and author details" },
      { value: "doctor", label: t.text("Doctor"),           hint: "validate a local extension folder" },
      { value: "exit",   label: t.muted("Exit") },
    ]

    const action = await p.select({ message: t.muted("what do you want to do?"), options })

    if (p.isCancel(action) || action === "exit") {
      p.outro(t.muted("bye :C"))
      process.exit(0)
    }

    if (action === "update" && newVersion) {
      p.outro(`run: ${t.brand(updateCmd())}`)
      process.exit(0)
    }
    if (action === "login") await loginCmd()
    if (action === "create") await createCmd()
    if (action === "search") await searchCmd()
    if (action === "doctor") await doctorCmd()
  }
}

main()
