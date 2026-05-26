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

const PAGE_SIZE = 10;

const parseSearchQuery = (): string | undefined => {
  const argStart = process.argv[2] === "search" ? 3 : 2;
  const args = process.argv.slice(argStart).filter((a) => !a.startsWith("-"));
  return args.length ? args.join(" ") : undefined;
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

const totalPages = (count: number) => Math.max(1, Math.ceil(count / PAGE_SIZE));

const renderResults = (
  data: SearchResp,
  page: number,
  showRelated: boolean,
) => {
  const cols = process.stdout.columns ?? 100;
  const maxWidth = Math.min(cols - 8, 90);
  const pad = "      ";
  const pages = totalPages(data.results.length);
  const start = (page - 1) * PAGE_SIZE;
  const pageResults = data.results.slice(start, start + PAGE_SIZE);

  console.log();
  console.log(
    `  ${t.muted(`page ${page}/${pages} · ${data.results.length} results · ${data.totalTime}ms`)}`,
  );
  console.log();

  pageResults.forEach((r, i) => {
    const num = t.dim(`  ${String(start + i + 1).padStart(2)}  `);
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

  if (showRelated && data.relatedSearches?.length) {
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

const promptQuery = async (): Promise<string | null> => {
  const query = await p.text({
    message: t.brand("search"),
    placeholder: "what are you looking for?",
  });
  if (p.isCancel(query) || !query) return null;
  return query;
};

const browseResults = async (data: SearchResp): Promise<"again" | "back"> => {
  let page = 1;
  const pages = totalPages(data.results.length);

  while (true) {
    renderResults(data, page, page === 1);

    const openOpts = data.results
      .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
      .map((r, i) => ({
        value: `open:${(page - 1) * PAGE_SIZE + i}`,
        label: t.text(truncate(r.title, 60)),
      }));

    const navOpts = [
      ...(page > 1
        ? [{ value: "prev", label: t.muted("previous page") }]
        : []),
      ...(page < pages
        ? [{ value: "next", label: t.muted("next page") }]
        : []),
    ];

    const action = await p.select({
      message: t.muted("open a result, search again, or go back"),
      options: [
        ...openOpts,
        ...navOpts,
        { value: "again", label: t.muted("search again") },
        { value: "back", label: t.muted("back to menu") },
      ],
    });

    if (p.isCancel(action) || action === "back") return "back";
    if (action === "again") return "again";
    if (action === "next") {
      page = Math.min(page + 1, pages);
      continue;
    }
    if (action === "prev") {
      page = Math.max(page - 1, 1);
      continue;
    }

    if (typeof action === "string" && action.startsWith("open:")) {
      const idx = parseInt(action.slice(5), 10);
      const target = data.results[idx];
      if (target) openUrl(target.url);
    }
  }
};

export const searchCmd = async () => {
  const config = await loadConfig();

  if (!config.instanceUrl) {
    p.log.warn(t.warning("no instance configured - run Login / Setup first"));
    return;
  }

  let pendingQuery = parseSearchQuery();

  while (true) {
    const query = pendingQuery ?? (await promptQuery());
    pendingQuery = undefined;

    if (!query) return;

    const data = await doSearch(query, config);
    if (!data) return;

    if (!data.results.length) {
      p.log.warn(t.muted("no results found"));
      continue;
    }

    const action = await browseResults(data);
    if (action === "back") return;
  }
};
