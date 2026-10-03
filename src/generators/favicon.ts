import { scaffoldDir, authorJsonTpl, readmeTpl } from "../utils/files"
import type { GeneratorCtx } from "../types"

const toClassName = (name: string): string =>
  name
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("") + "FaviconProvider"

const indexTpl = (name: string) => `export default class ${toClassName(name)} {
  name = "${name}";
  description = "Favicons for search results.";

  settingsSchema = [
    {
      key: "endpoint",
      label: "Endpoint",
      type: "url",
      default: "https://icons.example.com",
      description: "Base URL of the favicon service.",
    },
  ];

  endpoint = "https://icons.example.com";

  configure(settings) {
    if (typeof settings.endpoint === "string" && settings.endpoint.trim()) {
      this.endpoint = settings.endpoint.trim().replace(/\\/+$/, "");
    }
  }

  async getFavicon(host, context) {
    if (!host) return null;
    const size = context?.size ?? 32;
    return {
      url: \`\${this.endpoint}/\${encodeURIComponent(host)}.png?size=\${size}\`,
    };
  }
}
`

export const generateFavicon = async (ctx: GeneratorCtx): Promise<string> =>
  scaffoldDir(ctx.outDir, ctx.name, {
    "index.js": indexTpl(ctx.name),
    "README.md": readmeTpl(ctx.name, "A custom favicon provider for degoog."),
    "author.json": authorJsonTpl(ctx.config),
  })
