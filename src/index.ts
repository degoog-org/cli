import * as p from "@clack/prompts"
import { loginCmd } from "./commands/login.ts"
import { createCmd } from "./commands/create.ts"
import { searchCmd } from "./commands/search.ts"
import { title, t } from "./utils/theme.ts"
import { checkLatest, VERSION } from "./utils/version.ts"

const SUBCOMMANDS: Record<string, () => Promise<void>> = {
  create: async () => { await createCmd() },
  login:  async () => { await loginCmd() },
  search: async () => { await searchCmd() },
}

const main = async () => {
  const sub = process.argv[2]
  if (sub && sub in SUBCOMMANDS) {
    await SUBCOMMANDS[sub]!()
    process.exit(0)
  }

  p.intro(title)

  const updateCheck = checkLatest()

  const newVersion = await Promise.race([
    updateCheck,
    new Promise<null>((res) => setTimeout(() => res(null), 2000)),
  ])

  if (newVersion) {
    p.log.warn(t.warning(`v${newVersion} is available (you have v${VERSION}) - run the install script to update`))
  }

  while (true) {
    const action = await p.select({
      message: t.muted("what do you want to do?"),
      options: [
        { value: "create", label: t.text("Create extension"), hint: "scaffold a new degoog extension" },
        { value: "search", label: t.text("Search"),           hint: "search your degoog instance from the terminal" },
        { value: "login",  label: t.text("Login / Setup"),    hint: "configure your instance and author details" },
        { value: "exit",   label: t.muted("Exit") },
      ],
    })

    if (p.isCancel(action) || action === "exit") {
      p.outro(t.muted("bye"))
      process.exit(0)
    }

    if (action === "login") await loginCmd()
    if (action === "create") await createCmd()
    if (action === "search") await searchCmd()
  }
}

main()
