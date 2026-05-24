import { mkdir, writeFile } from "node:fs/promises"
import { join, resolve, dirname } from "node:path"
import { logger } from "./logger.ts"
import type { Config } from "../types/index.ts"
import { HTMLBundle } from "bun"

export const mkdirp = async (dir: string) => {
  await mkdir(dir, { recursive: true })
}

export const writeOut = async (filePath: string, content: string | HTMLBundle) => {
  // @ts-expect-error - Bun supports writing HTMLBundles
  await writeFile(filePath, content, "utf8")
}

export const resolveOut = (outDir: string, name: string) =>
  resolve(process.cwd(), outDir, name)

export const scaffoldDir = async (
  outDir: string,
  name: string,
  files: Record<string, string | HTMLBundle>
) => {
  const base = resolveOut(outDir, name)
  await mkdirp(base)
  for (const [filename, content] of Object.entries(files)) {
    const filePath = join(base, filename)
    await mkdirp(dirname(filePath))
    await writeOut(filePath, content)
    logger.success(`created ${filePath}`)
  }
  return base
}

export const authorJsonTpl = (cfg: Config): string =>
  JSON.stringify(
    {
      name: cfg.username ?? "",
      url: cfg.website ?? "",
    },
    null,
    2
  ) + "\n"

export const readmeTpl = (name: string, description: string): string =>
  `# ${name}

${description}

## Usage

<!-- explain how to use this extension -->

## Configuration

<!-- list any settings this extension requires -->
`
