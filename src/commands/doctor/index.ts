import { resolve } from "node:path"
import * as p from "@clack/prompts"
import { t } from "../../utils/theme.ts"
import { logger } from "../../utils/logger.ts"
import { promptText, promptConfirm } from "../../utils/prompts.ts"
import { exists, detectTarget } from "./detect.ts"
import { runChecks } from "./checks.ts"
import { runStoreChecks } from "./store.ts"
import { printResults } from "./report.ts"
import type { StoreRunSummary } from "./types.ts"

type ParsedArgs = {
  pathArg: string | undefined
  doFix: boolean
}

const parseArgs = (): ParsedArgs => {
  const argStart = process.argv[2] === "doctor" ? 3 : 2
  const args = process.argv.slice(argStart)
  const doFix = args.includes("--fix")
  const pathArg = args.find((a) => !a.startsWith("-"))
  return { pathArg, doFix }
}

const summaryLine = (s: StoreRunSummary): string =>
  [
    `${s.passed} passed`,
    s.fixed > 0 ? t.success(`${s.fixed} fixed`) : "",
    s.failed > 0 ? t.danger(`${s.failed} failed`) : "",
  ]
    .filter(Boolean)
    .join("  ")

export const doctorCmd = async (): Promise<void> => {
  const { pathArg, doFix: fixFlag } = parseArgs()

  p.intro(t.brand("degoog doctor"))

  const cwd = process.cwd()
  const targetDir = pathArg
    ? resolve(cwd, pathArg)
    : resolve(cwd, await promptText({
      message: t.muted("path to extension folder or store root"),
      defaultValue: cwd,
    }))

  const applyFix = fixFlag || (await promptConfirm(t.muted("apply safe fixes automatically?")))

  if (!(await exists(targetDir))) {
    logger.error(`directory not found: ${targetDir}`)
    process.exit(1)
  }

  const target = await detectTarget(targetDir)
  if (!target) {
    logger.error(
      `not a recognisable extension or store: ${targetDir}\n` +
        "  - an extension has theme.json or index.{ts,js}\n" +
        "  - a store has a package.json with plugins/themes/engines/transports/autocomplete arrays",
    )
    process.exit(1)
  }

  if (target.kind === "store") {
    p.log.info(t.muted(`checking store at ${targetDir}`))
    const summary = await runStoreChecks(
      target.dir,
      target.manifestPath,
      target.manifest,
      applyFix,
    )
    console.log("")
    if (summary.failed > 0) {
      p.outro(t.danger(`store has issues - ${summaryLine(summary)}`))
      process.exit(1)
    }
    p.outro(t.success(`store looks good - ${summaryLine(summary)}`))
    return
  }

  p.log.info(t.muted(`checking extension at ${targetDir}`))
  const { results, failed } = await runChecks(target.dir, applyFix, target.extKind)
  printResults(results)
  console.log("")

  if (failed && !applyFix) {
    p.outro(t.danger("issues found - re-run and choose to apply fixes, or pass --fix"))
    process.exit(1)
  }
  if (failed) {
    p.outro(t.warning("some issues could not be auto-fixed (see WARN above)"))
    process.exit(1)
  }
  p.outro(t.success("all checks passed"))
}
