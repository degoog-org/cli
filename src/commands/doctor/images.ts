import { readdir, readFile } from "node:fs/promises"
import { extname, join, relative } from "node:path"
import { logger } from "../../utils/logger"
import { readImageDims, type ImageDims } from "../../utils/image-dims"
import type { CheckResult } from "./types"

export const MAX_IMAGE_KB = 250
export const MAX_IMAGE_EDGE = 1600
const WEBP_QUALITY = 80
const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"])
const SKIP_DIRS = new Set(["node_modules", ".git"])

const toKb = (bytes: number): number => Math.round(bytes / 1024)

const listImages = async (dir: string): Promise<string[]> => {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    const found: string[] = []
    for (const e of entries) {
      const full = join(dir, e.name)
      if (e.isDirectory() && !SKIP_DIRS.has(e.name)) found.push(...(await listImages(full)))
      else if (e.isFile() && IMAGE_EXTS.has(extname(e.name).toLowerCase())) found.push(full)
    }
    return found.sort()
  } catch (err) {
    logger.warn(`could not scan ${dir} for images: ${String(err)}`)
    return []
  }
}

const webpCommand = (rel: string): string => {
  const out = rel.slice(0, rel.length - extname(rel).length) + ".webp"
  return `magick "${rel}" -resize "${MAX_IMAGE_EDGE}x${MAX_IMAGE_EDGE}>" -quality ${WEBP_QUALITY} "${out}"`
}

const shrinkAdvice = (rel: string, dims: ImageDims | null): string => {
  const steps: string[] = []
  if (dims && Math.max(dims.width, dims.height) > MAX_IMAGE_EDGE) {
    steps.push(`resize to ${MAX_IMAGE_EDGE}px on the longest side`)
  }
  const isWebp = extname(rel).toLowerCase() === ".webp"
  steps.push(isWebp ? "lower the WebP quality" : "convert to WebP")
  const readme = isWebp ? "" : " (then update README links)"
  return `${steps.join(" and ")}, e.g. ${webpCommand(rel)}${readme}`
}

const inspectImage = async (file: string, root: string): Promise<CheckResult | null> => {
  try {
    const buf = await readFile(file)
    if (toKb(buf.length) <= MAX_IMAGE_KB) return null
    const rel = relative(root, file)
    const dims = readImageDims(buf)
    const size = dims ? `${toKb(buf.length)} KB, ${dims.width}x${dims.height}` : `${toKb(buf.length)} KB`
    return {
      label: `image over ${MAX_IMAGE_KB} KB: ${rel}`,
      status: "warn",
      detail: `${size} - ${shrinkAdvice(rel, dims)}`,
    }
  } catch (err) {
    logger.warn(`could not read image ${file}: ${String(err)}`)
    return null
  }
}

export const checkImageSizes = async (dir: string): Promise<CheckResult[]> => {
  const images = await listImages(dir)
  if (images.length === 0) return []
  const inspected = await Promise.all(images.map((file) => inspectImage(file, dir)))
  const flagged = inspected.filter((r): r is CheckResult => r !== null)
  if (flagged.length > 0) return flagged
  return [{ label: `images within ${MAX_IMAGE_KB} KB (${images.length})`, status: "pass" }]
}
