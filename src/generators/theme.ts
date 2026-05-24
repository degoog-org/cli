import * as p from "@clack/prompts"
import { scaffoldDir, authorJsonTpl } from "../utils/files.ts"
import { t } from "../utils/theme.ts"
import type { GeneratorCtx } from "../types/index.ts"
import {
  layoutHtml, indexHtml, searchHtml, html404,
  gandalfHtml, robotsHtml,
  idxHeaderHtml, idxLogoHtml, idxSearchHtml, idxFooterHtml,
  srchHeaderHtml, srchTabsHtml, srchResultHtml,
  srchImageCardHtml, srchVideoCardHtml,
  srchMediaPreviewHtml, srchLightboxHtml, srchAtAGlanceHtml,
} from "../templates/theme-assets.ts"
import { HTMLBundle } from "bun"

export const HTML_PAGE_KEYS = ["layout", "index", "search", "404", "gandalf", "robots-takeover"] as const
const TEMPLATE_KEYS = [
  "home-logo", "home-search", "home-header", "home-footer",
  "search-header", "search-tabs", "result", "image-card",
  "video-card", "search-media-preview", "search-lightbox", "at-a-glance",
] as const

type HtmlPageKey = typeof HTML_PAGE_KEYS[number]
type TemplateKey = typeof TEMPLATE_KEYS[number]

const PAGE_PATHS: Record<HtmlPageKey, string> = {
  "layout": "layout.html",
  "index": "index.html",
  "search": "search.html",
  "404": "404.html",
  "gandalf": "easter-eggs/gandalf.html",
  "robots-takeover": "easter-eggs/robots-takeover.html",
}

const PAGE_CONTENT: Record<HtmlPageKey, HTMLBundle> = {
  "layout": layoutHtml,
  "index": indexHtml,
  "search": searchHtml,
  "404": html404,
  "gandalf": gandalfHtml,
  "robots-takeover": robotsHtml,
}

const TPL_PATHS: Record<TemplateKey, string> = {
  "home-logo": "index-templates/logo.html",
  "home-search": "index-templates/search.html",
  "home-header": "index-templates/header.html",
  "home-footer": "index-templates/footer.html",
  "search-header": "search-templates/header.html",
  "search-tabs": "search-templates/tabs.html",
  "result": "search-templates/result.html",
  "image-card": "search-templates/image-card.html",
  "video-card": "search-templates/video-card.html",
  "search-media-preview": "search-templates/media-preview.html",
  "search-lightbox": "search-templates/lightbox.html",
  "at-a-glance": "search-templates/at-a-glance.html",
}

const TPL_CONTENT: Record<TemplateKey, HTMLBundle> = {
  "home-logo": idxLogoHtml,
  "home-search": idxSearchHtml,
  "home-header": idxHeaderHtml,
  "home-footer": idxFooterHtml,
  "search-header": srchHeaderHtml,
  "search-tabs": srchTabsHtml,
  "result": srchResultHtml,
  "image-card": srchImageCardHtml,
  "video-card": srchVideoCardHtml,
  "search-media-preview": srchMediaPreviewHtml,
  "search-lightbox": srchLightboxHtml,
  "at-a-glance": srchAtAGlanceHtml,
}

const cssTpl = () => `:root {
  --primary: #5673ac;
  --primary-hover: #3b547c;
  --primary-rgb: 66, 133, 244;
  --brand-blue: #4285f4;
  --brand-yellow: #fbbc05;
  --danger: #ea4335;
  --warning: #c17d00;
  --success: #34a853;
  --bg: #f1f1f1;
  --bg-light: #fafafa;
  --bg-hover: #fafafa;
  --border: #c8d0da;
  --border-light: #dedede;
  --text-primary: #343536;
  --text-secondary: #4b5563;
  --text-link: #1a0dab;
  --text-link-visited: #681da8;
  --text-cite: #111827;
  --text-snippet: #374151;
  --search-bar-bg: #f7f8fb;
  --search-bar-bg-hover: #f7f8fb;
  --btn-bg: #f7f8fb;
  --btn-text: var(--text-primary);
  --overlay-bg: rgba(0, 0, 0, 0.4);
  --white: #fff;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --primary: #5673ac;
    --primary-hover: #3b547c;
    --primary-rgb: 66, 133, 244;
    --brand-blue: #4285f4;
    --brand-yellow: #fbbc05;
    --danger: #ea4335;
    --warning: #fbbc05;
    --success: #34a853;
    --bg: #25272e;
    --bg-light: #303134;
    --bg-hover: #3c4043;
    --border: #5f6368;
    --border-light: #303134;
    --text-primary: #dddddd;
    --text-secondary: #9aa0a6;
    --text-link: #8ab4f8;
    --text-link-visited: #c58af9;
    --text-cite: #bdc1c6;
    --text-snippet: #bdc1c6;
    --search-bar-bg: #303134;
    --search-bar-bg-hover: #303134;
    --btn-bg: #303134;
    --btn-text: var(--text-primary);
    --overlay-bg: rgba(0, 0, 0, 0.6);
    --white: #fff3f3;
  }
}

[data-theme="dark"] {
  --bg: #25272e;
  --bg-light: #303134;
  --bg-hover: #3c4043;
  --border: #5f6368;
  --border-light: #303134;
  --text-primary: #dddddd;
  --text-secondary: #9aa0a6;
  --text-link: #8ab4f8;
  --text-link-visited: #c58af9;
  --text-cite: #bdc1c6;
  --text-snippet: #bdc1c6;
  --search-bar-bg: #303134;
  --search-bar-bg-hover: #303134;
  --btn-bg: #303134;
  --btn-text: var(--text-primary);
  --overlay-bg: rgba(0, 0, 0, 0.6);
  --white: #fff3f3;
}

[data-theme="light"] {
  --bg: #f1f1f1;
  --bg-light: #fafafa;
  --bg-hover: #fafafa;
  --border: #c8d0da;
  --border-light: #dedede;
  --text-primary: #343536;
  --text-secondary: #4b5563;
  --text-link: #1a0dab;
  --text-link-visited: #681da8;
  --text-cite: #111827;
  --text-snippet: #374151;
  --search-bar-bg: #f7f8fb;
  --search-bar-bg-hover: #f7f8fb;
  --btn-bg: #f7f8fb;
  --btn-text: var(--text-primary);
  --overlay-bg: rgba(0, 0, 0, 0.4);
  --white: #fff;
}
`

const themeReadmeTpl = (name: string) =>
  `# ${name}

A custom UI theme for degoog.

## Customising colours

All colours live in \`style.css\` as CSS custom properties on \`:root\`.
Override only what you need - everything else falls back to the default theme.

The file contains blocks for \`:root\` (light), \`[data-theme="dark"]\`,
\`[data-theme="light"]\`, and a \`@media (prefers-color-scheme: dark)\` query.

## Overriding templates

Templates listed under the \`templates\` key in \`theme.json\` replace individual
UI sections without touching anything else. Only include keys you want to change.

## Static assets

Any file inside your theme folder is served at \`/themes/<theme-id>/<path>\`.
In HTML templates use \`__THEME_PATH__\` for absolute references:

\`\`\`html
<img src="__THEME_PATH__/images/logo.png" />
\`\`\`

See the [full theme docs](https://degoog.org/docs/themes.html) for all available
template keys, inner IDs, and placeholder tokens.
`

type Selection = {
  includeCss: boolean
  pages: HtmlPageKey[]
  templates: TemplateKey[]
  includeSettings: boolean
}

const buildThemeJson = (name: string, sel: Selection): string => {
  type Manifest = {
    name: string
    description: string
    css?: string
    html?: Partial<Record<HtmlPageKey, string>>
    templates?: Partial<Record<TemplateKey, string>>
    settingsSchema?: unknown[]
    dataAttrsFromSettings?: Record<string, string>
  }

  const manifest: Manifest = { name, description: "" }

  if (sel.includeCss) manifest.css = "style.css"

  if (sel.pages.length > 0) {
    const html: Partial<Record<HtmlPageKey, string>> = {}
    for (const key of sel.pages) html[key] = PAGE_PATHS[key]
    manifest.html = html
  }

  if (sel.templates.length > 0) {
    const templates: Partial<Record<TemplateKey, string>> = {}
    for (const key of sel.templates) templates[key] = TPL_PATHS[key]
    manifest.templates = templates
  }

  if (sel.includeSettings) {
    manifest.settingsSchema = []
    manifest.dataAttrsFromSettings = {}
  }

  return JSON.stringify(manifest, null, 2) + "\n"
}

export const generateTheme = async (ctx: GeneratorCtx) => {
  const chosen = await p.multiselect<string>({
    message: t.muted("what do you want to include in your theme?"),
    options: [
      { value: "css", label: t.text("Custom styles"), hint: "CSS variable overrides for colours and spacing" },
      { value: "layout", label: t.text("Base layout"), hint: "Full HTML shell - head, scripts, tokens. Override with care" },
      { value: "index", label: t.text("Home page"), hint: "index.html - the landing page" },
      { value: "search", label: t.text("Search results page"), hint: "search.html - the full results listing" },
      { value: "404", label: t.text("404 page"), hint: "Custom not-found page" },
      { value: "easter-eggs", label: t.text("Easter eggs"), hint: "Gandalf and robots-takeover pages" },
      { value: "home-logo", label: t.text("Home: logo"), hint: "Replace the logo area on the home page" },
      { value: "home-search", label: t.text("Home: search bar"), hint: "Replace the search form on the home page" },
      { value: "home-header", label: t.text("Home: header"), hint: "Replace the top navigation on the home page" },
      { value: "home-footer", label: t.text("Home: footer"), hint: "Replace the page footer" },
      { value: "search-header", label: t.text("Search: header bar"), hint: "Logo + search bar + settings gear on results page" },
      { value: "search-tabs", label: t.text("Search: result tabs"), hint: "Web / Images / Videos / News tab strip" },
      { value: "result", label: t.text("Search: result card"), hint: "Individual web and news result items" },
      { value: "image-card", label: t.text("Search: image card"), hint: "Image grid thumbnails" },
      { value: "video-card", label: t.text("Search: video card"), hint: "Video result cards" },
      { value: "search-media-preview", label: t.text("Search: media preview"), hint: "Expanded image/video preview panel" },
      { value: "search-lightbox", label: t.text("Search: lightbox"), hint: "Full-screen image lightbox" },
      { value: "at-a-glance", label: t.text("Search: at-a-glance"), hint: "AI / knowledge panel" },
      { value: "settings-schema", label: t.text("User settings"), hint: "Adds configurable options (e.g. colour variants)" },
    ],
    required: false,
  })

  if (p.isCancel(chosen)) {
    p.cancel(t.muted("cancelled"))
    process.exit(0)
  }

  const sel: Selection = {
    includeCss: chosen.includes("css"),
    pages: [
      ...(chosen.includes("layout") ? ["layout" as HtmlPageKey] : []),
      ...(chosen.includes("index") ? ["index" as HtmlPageKey] : []),
      ...(chosen.includes("search") ? ["search" as HtmlPageKey] : []),
      ...(chosen.includes("404") ? ["404" as HtmlPageKey] : []),
      ...(chosen.includes("easter-eggs") ? ["gandalf" as HtmlPageKey, "robots-takeover" as HtmlPageKey] : []),
    ],
    templates: TEMPLATE_KEYS.filter(k => chosen.includes(k)),
    includeSettings: chosen.includes("settings-schema"),
  }

  const files: Record<string, string | HTMLBundle> = {
    "theme.json": buildThemeJson(ctx.name, sel),
    "README.md": themeReadmeTpl(ctx.name),
    "author.json": authorJsonTpl(ctx.config),
  }

  if (sel.includeCss) files["style.css"] = cssTpl()
  for (const key of sel.pages) files[PAGE_PATHS[key]] = PAGE_CONTENT[key]
  for (const key of sel.templates) files[TPL_PATHS[key]] = TPL_CONTENT[key]

  return scaffoldDir(ctx.outDir, ctx.name, files)
}
  