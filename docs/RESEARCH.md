# Competitive Research — Tech News Aggregators & Reusable Code

> Research conducted April 1, 2026. Stars and status may have changed.

## Landscape

### Existing Tech News Aggregators

| Project | Stars | What It Does | Key Takeaway |
|---------|-------|-------------|--------------|
| [imsyy/DailyHotApi](https://github.com/imsyy/DailyHotApi) | 3,706 | Multi-source "today's hot" API (GitHub, Weibo, etc.) | Best architecture reference for multi-source fetching with retry/cache. Hono-based, TypeScript, MIT |
| [langchain-ai/social-media-agent](https://github.com/langchain-ai/social-media-agent) | 2,435 | LangGraph agent curating HN + GitHub for social posts | Working GitHub trending + HN loaders. Overkill architecture but clean loader patterns |
| [miantiao-me/hacker-podcast](https://github.com/miantiao-me/hacker-podcast) | 2,486 | HN + AI summaries → podcast audio | Closest to our concept. Shows the pipeline: fetch → AI summarize → store → serve |
| [clintonwoo/hackernews-react-graphql](https://github.com/clintonwoo/hackernews-react-graphql) | 4,514 | Next.js + GraphQL HN clone | SSR HN with Next.js. Overkill (GraphQL) but shows the pattern |
| [bensadeh/circumflex](https://github.com/bensadeh/circumflex) | 1,914 | Terminal HN reader | Go-based. Reference for CLI output styling |
| [fellowgeek/hacker-news-dashboard](https://github.com/fellowgeek/hacker-news-dashboard) | — | HN digital signage dashboard | Vanilla JS/HTML/CSS |

### GitHub Trending Scrapers

| Project | Stars | Status | Notes |
|---------|-------|--------|-------|
| [huchenme/github-trending-api](https://github.com/huchenme/github-trending-api) | 818 | Last published 2020 | Was the definitive solution. 9 deps (axios, express, memory-cache). Selectors may be outdated |
| [raycast/extensions](https://github.com/raycast/extensions) | — | Actively maintained | Has working GitHub trending scraper at `extensions/github-trending/src/lib/trending-github.ts`. MIT. Best selectors to copy |
| [imsyy/DailyHotApi](https://github.com/imsyy/DailyHotApi) | 3,706 | Active (March 2026) | GitHub trending route at `src/routes/github.ts`. Cheerio + retry + caching. MIT |

### HN API Libraries

| Package | Version | License | Notes |
|---------|---------|---------|-------|
| `node-hn-api` | 4.0.1 | MIT | TypeScript, zero deps. Works but wraps 2 trivial fetch calls. Not worth the dependency |
| `hackernews-api` | 1.0.0 | Proprietary | Old, uses deprecated `xmlhttprequest`. Skip |
| `hn-api` | 0.1.5 | Proprietary | Uses deprecated `request` module. Skip |

**Verdict:** The HN API is so simple (two endpoints) that a dependency is unnecessary.

## What We're Reusing

### Code Patterns to Copy (MIT-licensed)

| Pattern | Source | Key File |
|---------|--------|----------|
| HN top stories fetcher | `vercel-labs/json-render` | `examples/chat/lib/tools/hackernews.ts` (~50 lines) |
| HN with comments | `memfreeme/memfree` | `frontend/lib/tools/hacker-news.ts` |
| GitHub trending scraper selectors | `raycast/extensions` | `extensions/github-trending/src/lib/trending-github.ts` |
| GitHub trending with retry/cache | `imsyy/DailyHotApi` | `src/routes/github.ts` |
| GitHub trending loader (minimal) | `langchain-ai/social-media-agent` | `src/agents/curate-data/loaders/github/trending.ts` |

### npm Packages to Install

| Package | Purpose | Why This One |
|---------|---------|-------------|
| `cheerio` | Parse GitHub trending HTML | Standard HTML parser, MIT, stable at v1.0.0 |
| `ai` | Vercel AI SDK | Claude Haiku integration for summarization |
| `@ai-sdk/anthropic` | Anthropic provider | Required for `model: 'anthropic/claude-haiku-4-5'` |

### What to Build from Scratch

1. **HN fetcher** (~50 lines) — two `fetch()` calls, `Promise.allSettled` for batching
2. **GitHub trending scraper** (~80 lines) — fetch HTML, cheerio parse, retry
3. **AI filter/summarizer** (~40 lines) — AI SDK `generateText` with structured prompt
4. **Cron handler** — orchestrates fetchers, dedup, write to Vercel Blob
5. **Dashboard** — Next.js App Router + RSC + shadcn/ui, Palantir theme

## API Reference

### Hacker News API (Firebase)

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

### GitHub Trending (Scrape)

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

- No official API — scraping only
- Requires `User-Agent` header
- HTML structure can change without notice — always wrap in try/catch
- Filter by language: `/trending/typescript`, `/trending/python`, etc.

## Market Gap

**Nobody combines all of these in one product:**
- Multi-source aggregation (HN + GitHub + changelogs)
- AI relevance filtering
- AI title summarization
- Palantir/sci-fi dashboard aesthetic
- Vercel-native deployment (zero maintenance)
- 7-day rolling window (no database, just blobs)

daily.dev is the closest commercial product but it's a browser extension, not a self-hosted intelligence dashboard.

## Architecture Patterns Observed

Most news aggregators converge on:
- **Cron-based fetching** — not real-time, scheduled interval
- **Dedup by URL** — simple and effective
- **Cheerio for scraping** — standard across all GitHub trending projects
- **Firebase API for HN** — everyone uses the same two endpoints
- **JSON storage** — most simple projects skip databases entirely

**Our differentiation:** Palantir-styled dashboard with AI intelligence layer, deployed on Vercel with zero maintenance. Same design language as Claude Mission Control.
