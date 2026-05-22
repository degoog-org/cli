export const VERSION = "0.1.0"
export const REPO = "degoog-org/cli"

export const checkLatest = async (): Promise<string | null> => {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { "User-Agent": "degoog-cli" },
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return null
    const data = await res.json() as { tag_name?: string }
    const tag = data.tag_name?.replace(/^v/, "") ?? null
    return tag !== VERSION ? tag : null
  } catch {
    return null
  }
}

export enum InstallMethod {
  Bun    = "bun",
  Npm    = "npm",
  Source = "source",
  Binary = "binary",
}

export const detectInstall = (): InstallMethod => {
  const bin = process.execPath
  if (bin.includes("/.bun/") || bin.includes("bun/bin")) return InstallMethod.Bun
  if (bin.includes("node_modules"))                        return InstallMethod.Npm
  if (bin.includes("/src/") || bin.endsWith(".ts"))        return InstallMethod.Source
  return InstallMethod.Binary
}

export const updateCmd = (version: string): string => {
  switch (detectInstall()) {
    case InstallMethod.Bun:    return `bun update -g degoog-cli`
    case InstallMethod.Npm:    return `npm update -g degoog-cli`
    case InstallMethod.Source: return `git pull && bun run build`
    case InstallMethod.Binary: return `curl -fsSL https://raw.githubusercontent.com/${REPO}/main/install.sh | sh`
  }
}
