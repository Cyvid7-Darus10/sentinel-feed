# Prior art

Notes from the survey done before any code was written, on April 1, 2026. Star counts and project status have almost certainly moved since. Some of the plans here were not followed: shadcn/ui was dropped in favor of plain Tailwind, and the Anthropic provider package was replaced by model strings through the AI Gateway. Kept as a record of why the shape of the thing is what it is.

## What already existed

### Aggregators

| Project | Stars | What it does | Takeaway |
|---------|-------|-------------|--------------|
| [imsyy/DailyHotApi](https://github.com/imsyy/DailyHotApi) | 3,706 | Multi-source "today's hot" API (GitHub, Weibo, etc.) | Best architecture reference for multi-source fetching with retry/cache. Hono-based, TypeScript, MIT |
| [langchain-ai/social-media-agent](https://github.com/langchain-ai/social-media-agent) | 2,435 | LangGraph agent curating HN + GitHub for social posts | Working GitHub trending + HN loaders. Overkill architecture but clean loader patterns |
| [miantiao-me/hacker-podcast](https://github.com/miantiao-me/hacker-podcast) | 2,486 | HN + AI summaries → podcast audio | Closest to our concept. Shows the pipeline: fetch → AI summarize → store → serve |
| [clintonwoo/hackernews-react-graphql](https://github.com/clintonwoo/hackernews-react-graphql) | 4,514 | Next.js + GraphQL HN clone | SSR HN with Next.js. Overkill (GraphQL) but shows the pattern |
| [bensadeh/circumflex](https://github.com/bensadeh/circumflex) | 1,914 | Terminal HN reader | Go-based. Reference for CLI output styling |
| [fellowgeek/hacker-news-dashboard](https://github.com/fellowgeek/hacker-news-dashboard) | n/a | HN digital signage dashboard | Vanilla JS/HTML/CSS |

### GitHub Trending scrapers

| Project | Stars | Status | Notes |
|---------|-------|--------|-------|
| [huchenme/github-trending-api](https://github.com/huchenme/github-trending-api) | 818 | Last published 2020 | Was the definitive solution. 9 deps (axios, express, memory-cache). Selectors may be outdated |
| [raycast/extensions](https://github.com/raycast/extensions) | n/a | Actively maintained | Has working GitHub trending scraper at `extensions/github-trending/src/lib/trending-github.ts`. MIT. Best selectors to copy |
| [imsyy/DailyHotApi](https://github.com/imsyy/DailyHotApi) | 3,706 | Active (March 2026) | GitHub trending route at `src/routes/github.ts`. Cheerio + retry + caching. MIT |

### HN API libraries

| Package | Version | License | Notes |
|---------|---------|---------|-------|
| `node-hn-api` | 4.0.1 | MIT | TypeScript, zero deps. Works but wraps 2 trivial fetch calls. Not worth the dependency |
| `hackernews-api` | 1.0.0 | Proprietary | Old, uses deprecated `xmlhttprequest`. Skip |
| `hn-api` | 0.1.5 | Proprietary | Uses deprecated `request` module. Skip |

**Verdict:** The HN API is so simple (two endpoints) that a dependency is unnecessary.

## What we borrowed

### Patterns worth copying (all MIT)

| Pattern | Source | Key File |
|---------|--------|----------|
| HN top stories fetcher | `vercel-labs/json-render` | `examples/chat/lib/tools/hackernews.ts` (~50 lines) |
| HN with comments | `memfreeme/memfree` | `frontend/lib/tools/hacker-news.ts` |
| GitHub trending scraper selectors | `raycast/extensions` | `extensions/github-trending/src/lib/trending-github.ts` |
| GitHub trending with retry/cache | `imsyy/DailyHotApi` | `src/routes/github.ts` |
| GitHub trending loader (minimal) | `langchain-ai/social-media-agent` | `src/agents/curate-data/loaders/github/trending.ts` |

### Packages to install

| Package | Purpose | Why This One |
|---------|---------|-------------|
| `cheerio` | Parse GitHub trending HTML | Standard HTML parser, MIT, stable at v1.0.0 |
| `ai` | Vercel AI SDK | Claude Haiku integration for summarization |
| `@ai-sdk/anthropic` | Anthropic provider | Required for `model: 'anthropic/claude-haiku-4-5'` |

### What to write ourselves

1. HN fetcher, around 50 lines: two `fetch()` calls with `Promise.allSettled` for the batch.
2. GitHub trending scraper, around 80 lines: fetch the HTML, parse with cheerio, retry.
3. AI filter and summarizer, around 40 lines: one `generateText` call with a structured prompt.
4. Cron handler to orchestrate the fetchers, dedup, and write to Vercel Blob.
5. Dashboard on the Next.js App Router with RSC and the Palantir theme.

## API notes

### Hacker News (Firebase)

Base URL: `https://hacker-news.firebaseio.com/v0`

| Endpoint | Returns | Notes |
|----------|---------|-------|
| `/topstories.json` | `number[]` | Up to 500 story IDs, sorted by ranking |
| `/beststories.json` | `number[]` | Top stories by score |
| `/newstories.json` | `number[]` | 500 newest stories |
| `/item/{id}.json` | `Item` | Single story/comment/poll |

Item shape:
```typescript
interface HNItem {
  id: number;
  type: 'story' | 'comment' | 'job' | 'poll';
  by: string;            // Author username
  time: number;          // Unix timestamp
  title: string;
  url?: string;          // External link (missing for Ask HN, text posts)
  score: number;         // Points
  descendants: number;   // Comment count
  kids?: number[];       // Child comment IDs
  text?: string;         // HTML body (for text posts)
}
```

- Free, no auth required, no documented rate limits
- Firebase-based, generally very permissive
- Batch strategy: fetch 30 IDs, 10 concurrent with `Promise.allSettled`

### GitHub Trending (scrape)

URL: `https://github.com/trending/{language}?since={daily|weekly|monthly}`

Key cheerio selectors (from Raycast extensions, confirmed working):
```typescript
$("article").each((_, repo) => {
  const fullName = $(repo).find("h2 a").text().replace(/\s/g, "");
  const [owner, name] = fullName.split("/");
  const description = $(repo).find("p").text().trim();
  const language = $(repo).find("[itemprop=programmingLanguage]").text().trim();
  const starsText = $(repo).find('a[href$="/stargazers"]').text().trim();
  const forksText = $(repo).find('a[href$="/forks"]').text().trim();
});
```

- No official API, so scraping is the only option.
- A `User-Agent` header is required.
- The HTML can change without notice, so every call has to be wrapped in try/catch.
- Filter by language: `/trending/typescript`, `/trending/python`, etc.

## The gap

Plenty of projects do one or two of multi-source aggregation, AI filtering, AI summarization, and a self-hosted dashboard. None of the ones surveyed did all of them, and none of them looked like an instrument panel. daily.dev is the closest commercial equivalent, but it ships as a browser extension rather than something you can deploy and own.

## Where everyone converges

The surveyed projects agree on more than they disagree on. Fetching is cron-based rather than real-time. Dedup is by URL, and nothing more clever than that. Scraping GitHub means cheerio, in every single case. HN means the same two Firebase endpoints for everyone. And the smaller projects skip databases entirely and write JSON.

We followed all five. The parts we did differently are the dashboard, which uses the same design language as Claude Mission Control, and the AI layer between fetch and store.
