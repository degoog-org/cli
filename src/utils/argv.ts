const BOOLEAN_FLAGS = new Set([
  "-y",
  "--yes",
  "--headless",
  "--fix",
  "--json",
  "--challenges",
  "--handles-challenges",
  "--init-store",
  "--no-color",
  "-h",
  "--help",
  "-v",
  "--version",
])

type Parsed = {
  positionals: string[]
  flags: Map<string, string | true>
}

const parse = (args: string[]): Parsed => {
  const positionals: string[] = []
  const flags = new Map<string, string | true>()

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!
    if (!arg.startsWith("-") || arg === "-") {
      positionals.push(arg)
      continue
    }
    if (arg === "--") {
      positionals.push(...args.slice(i + 1))
      break
    }
    const eq = arg.indexOf("=")
    if (eq !== -1) {
      flags.set(arg.slice(0, eq), arg.slice(eq + 1))
      continue
    }
    if (BOOLEAN_FLAGS.has(arg)) {
      flags.set(arg, true)
      continue
    }
    const next = args[i + 1]
    if (next !== undefined && !next.startsWith("-")) {
      flags.set(arg, next)
      i++
    } else {
      flags.set(arg, true)
    }
  }

  return { positionals, flags }
}

const parsed = parse(process.argv.slice(2))

const str = (...names: string[]): string | undefined => {
  for (const name of names) {
    const v = parsed.flags.get(name)
    if (typeof v === "string") return v
  }
  return undefined
}

const bool = (...names: string[]): boolean | undefined => {
  for (const name of names) {
    const v = parsed.flags.get(name)
    if (v === undefined) continue
    if (v === true) return true
    const lower = v.toLowerCase()
    if (["false", "0", "no", "off"].includes(lower)) return false
    return true
  }
  return undefined
}

export const positionalsAfter = (command: string): string[] =>
  parsed.positionals[0] === command ? parsed.positionals.slice(1) : parsed.positionals

export const argv = {
  command: parsed.positionals[0],
  name: str("--name"),
  type: str("--type"),
  out: str("--out"),
  include: str("--include"),
  initStore: bool("--init-store") ?? false,
  challenges: bool("--challenges"),
  handlesChallenges: bool("--handles-challenges"),
  instanceUrl: str("--instance-url"),
  apiKey: str("--api-key"),
  username: str("--username"),
  website: str("--website"),
  fix: bool("--fix") ?? false,
  pluginType: str("--plugin-type"),
  json: bool("--json") ?? false,
  limit: str("--limit"),
  headless: bool("-y", "--yes", "--headless") ?? false,
  noColor: bool("--no-color") ?? false,
  help: bool("-h", "--help") ?? false,
  version: bool("-v", "--version") ?? false,
}
