import * as p from "@clack/prompts";
import { loadConfig } from "../config/store.ts";
import { apiGet } from "../utils/api.ts";
import { t } from "../utils/theme.ts";

type Result = {
  title: string;
  url: string;
  snippet: string;
  sources: string[];
};

type SearchResp = {
  results: Result[];
  totalTime: number;
  relatedSearches: string[];
};

const openUrl = (url: string) => {
  const cmd = process.platform === "darwin" ? "open" : "xdg-open";
  try {
    Bun.spawn([cmd, url], { stdout: "ignore", stderr: "ignore" });
  } catch {
    console.log(
      `\n Sorry bub, could not open URL in browser. You do it: ${url}. \n`,
    );
  }
};

const wrap = (text: string, width: number): string[] => {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (line.length + word.length + 1 > width) {
      if (line) lines.push(line.trimEnd());
      line = word + " ";
    } else {
      line += word + " ";
    }
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines;
};

const truncate = (s: string, max: number) =>
  s.length > max ? s.slice(0, max - 1) + "…" : s;

const renderResults = (data: SearchResp) => {
  const cols = process.stdout.columns ?? 100;
  const maxWidth = Math.min(cols - 8, 90);
  const pad = "      ";

  console.log();
  console.log(
    `  ${t.muted(`${data.results.length} results · ${data.totalTime}ms`)}`,
  );
  console.log();

  data.results.forEach((r, i) => {
    const num = t.dim(`  ${String(i + 1).padStart(2)}  `);
    console.log(`${num}${t.bold(t.brand(truncate(r.title, maxWidth)))}`);
    console.log(`${pad}${t.success(truncate(r.url, maxWidth))}`);

    if (r.snippet) {
      const lines = wrap(r.snippet, maxWidth);
      lines.forEach((l) => console.log(`${pad}${t.muted(l)}`));
    }

    if (r.sources?.length) {
      console.log(`${pad}${t.dim("via " + r.sources.join(" · "))}`);
    }

    console.log();
  });

  if (data.relatedSearches?.length) {
    const related = data.relatedSearches
      .slice(0, 5)
      .map((s) => t.primary(s))
      .join(t.muted("  ·  "));
    console.log(`  ${t.muted("related:")}  ${related}`);
    console.log();
  }
};

const doSearch = async (
  query: string,
  config: Awaited<ReturnType<typeof loadConfig>>,
) => {
  const spin = p.spinner();
  spin.start(t.muted("searching…"));

  const result = await apiGet<SearchResp>(
    config,
    `/api/search?q=${encodeURIComponent(query)}`,
  );

  if (!result.ok) {
    spin.stop(t.danger(result.error));
    return null;
  }

  spin.stop(t.muted(`done`));
  return result.data;
};

export const searchCmd = async () => {
  const config = await loadConfig();

  if (!config.instanceUrl) {
    p.log.warn(t.warning("no instance configured - run Login / Setup first"));
    return;
  }

  while (true) {
    const query = await p.text({
      message: t.brand("search"),
      placeholder: "what are you looking for?",
    });
    if (p.isCancel(query) || !query) return;

    const data = await doSearch(query, config);
    if (!data) return;

    if (!data.results.length) {
      p.log.warn(t.muted("no results found"));
      continue;
    }

    renderResults(data);

    const openOpts = data.results.slice(0, 5).map((r, i) => ({
      value: `open:${i}`,
      label: t.text(`open #${i + 1}`),
      hint: truncate(r.title, 50),
    }));

    const action = await p.select({
      message: t.muted("open a result, search again, or go back"),
      options: [
        ...openOpts,
        { value: "again", label: t.muted("search again") },
        { value: "back", label: t.muted("back to menu") },
      ],
    });

    if (p.isCancel(action) || action === "back") return;

    if (action === "again") continue;

    if (typeof action === "string" && action.startsWith("open:")) {
      const idx = parseInt(action.slice(5), 10);
      const target = data.results[idx];
      if (target) openUrl(target.url);
    }
  }
};
