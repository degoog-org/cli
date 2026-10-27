import pkg from "../../package.json" with { type: "json" }

export const VERSION = pkg.version
export const REPO = "degoog-org/cli"

const toParts = (v: string): number[] =>
  v.replace(/^v/, "").split("-")[0]!.split(".").map((n) => Number(n) || 0)

export const isNewer = (latest: string, current: string): boolean => {
  const a = toParts(latest)
  const b = toParts(current)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0)
    if (diff !== 0) return diff > 0
  }
  return false
}

export const checkLatest = async (): Promise<string | null> => {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { "User-Agent": "degoog-cli" },
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return null
    const data = await res.json() as { tag_name?: string }
    const tag = data.tag_name?.replace(/^v/, "") ?? null
    return tag && isNewer(tag, VERSION) ? tag : null
  } catch {
    return null
  }
}

export enum InstallMethod {
  Bun = "bun",
  Npm = "npm",
  Source = "source",
  Binary = "binary",
}

export const detectInstall = (): InstallMethod => {
  const bin = process.execPath
  if (bin.includes("/.bun/") || bin.includes("bun/bin")) return InstallMethod.Bun
  if (bin.includes("node_modules")) return InstallMethod.Npm
  if (bin.includes("/src/") || bin.endsWith(".ts")) return InstallMethod.Source
  return InstallMethod.Binary
}

export const updateCmd = (): string => {
  switch (detectInstall()) {
    case InstallMethod.Bun: return `bun update -g degoog-cli`
    case InstallMethod.Npm: return `npm update -g degoog-cli`
    case InstallMethod.Source: return `git pull && bun run build`
    case InstallMethod.Binary: return `curl -fsSL https://raw.githubusercontent.com/${REPO}/main/install.sh | sh`
  }
}
