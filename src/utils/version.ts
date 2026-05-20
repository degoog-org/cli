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
