import { scaffoldDir, authorJsonTpl } from "../utils/files.ts"
import type { GeneratorCtx } from "../types/index.ts"

const themeJsonTpl = (name: string) => JSON.stringify(
  {
    name,
    description: "",
    version: "1.0.0",
    css: "style.css",
    templates: {
      "home-logo": "templates/logo.html",
    },
  },
  null,
  2
) + "\n"

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

[data-theme="light"] {
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
`

const logoTpl = (name: string) =>
  `<div id="home-logo">
  <p class="logo">${name}</p>
</div>
`

const themeReadmeTpl = (name: string) =>
  `# ${name}

A custom UI theme for degoog.

## Customising colours

All colours live in \`style.css\` as CSS custom properties on \`:root\`.
Override only what you need - everything else falls back to the default theme automatically.

The file already contains blocks for \`:root\` (light), \`[data-theme="dark"]\`,
\`[data-theme="light"]\`, and a \`@media (prefers-color-scheme: dark)\` query so
both explicit user preference and system-level preference are handled.

## Overriding templates

Degoog lets you replace individual HTML sections without touching anything else.
Templates are listed under the \`templates\` key in \`theme.json\`.

\`\`\`json
{
  "templates": {
    "home-logo": "templates/logo.html"
  }
}
\`\`\`

The generated \`templates/logo.html\` is a working example that replaces the home
page logo. Use it as a starting point and customise freely.

Available template keys:

| Key | What it controls |
|---|---|
| \`home-logo\` | Main logo and branding on the home page |
| \`home-search\` | The primary search form |
| \`home-header\` | Top navigation bar |
| \`home-footer\` | Page footer |
| \`search-header\` | Logo + search bar + settings gear on results page |
| \`result\` | Individual web and news result items |

Only include keys for sections you actually want to change.
See the [full theme docs](https://degoog.org/docs/themes.html) for the complete
list, required inner IDs, and available template placeholders.

## Static assets

Any file inside your theme folder is served at \`/themes/<theme-id>/<path>\`.
In CSS use relative URLs, in HTML templates use \`__THEME_PATH__\`:

\`\`\`html
<img src="__THEME_PATH__/images/logo.png" />
\`\`\`

## Configuration
`

export const generateTheme = async (ctx: GeneratorCtx) =>
  scaffoldDir(ctx.outDir, ctx.name, {
    "theme.json": themeJsonTpl(ctx.name),
    "style.css": cssTpl(),
    "README.md": themeReadmeTpl(ctx.name),
    "author.json": authorJsonTpl(ctx.config),
    "templates/logo.html": logoTpl(ctx.name),
  })
