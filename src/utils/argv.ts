const args = process.argv.slice(2)

const flag = (name: string): string | undefined => {
  const i = args.indexOf(name)
  return i !== -1 ? args[i + 1] : undefined
}

export const argv = {
  name: flag("--name"),
  type: flag("--type"),
  out:  flag("--out"),
}
