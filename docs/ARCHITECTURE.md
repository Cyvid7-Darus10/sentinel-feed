# Sentinel Feed — Architecture

> System architecture for the personal tech intelligence feed.

## Overview

Sentinel Feed is a serverless news aggregation pipeline deployed on Vercel. It runs on a 15-minute cron cycle, pulling stories from multiple sources, filtering and summarizing them with Claude AI, and presenting them in a Palantir-styled dashboard.

There is no persistent server. No database. Just Vercel Functions triggered by cron, Vercel Blob for storage, and Next.js Server Components for rendering.

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Vercel Platform                          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Cron Jobs (vercel.json)                             │   │
│  │  */15 * * * *  → POST /api/fetch                     │   │
│  │  0 0 * * *     → POST /api/cleanup                   │   │
│  └───────┬──────────────────────────────┬───────────────┘   │
│          │                              │                    │
│          ▼                              ▼                    │
│  ┌───────────────┐              ┌───────────────┐           │
│  │ /api/fetch    │              │ /api/cleanup   │           │
│  │               │              │               │           │
│  │ 1. Fetch HN   │              │ Delete blobs  │           │
│  │ 2. Fetch GH   │              │ older than    │           │
│  │ 3. Dedup URLs │              │ 7 days        │           │
│  │ 4. AI filter  │              └───────┬───────┘           │
│  │ 5. AI summary │                      │                    │
│  │ 6. Write blob │                      │                    │
│  └───────┬───────┘                      │                    │
│          │                              │                    │
│          ▼                              ▼                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Vercel Blob                          │   │
│  │                                                      │   │
│  │  feed/2026-04-01.json     ← today's stories          │   │
│  │  feed/2026-03-31.json     ← yesterday                │   │
│  │  feed/2026-03-30.json     ← ...                      │   │
│  │  feed/2026-03-29.json     ← ...                      │   │
│  │  feed/...                 ← up to 7 days             │   │
│  │  meta/sources.json        ← source health status     │   │
│  │                                                      │   │
│  └───────────────────────────────────────┬──────────────┘   │
│                                          │                   │
│          ┌───────────────────────────────┘                   │
│          │                                                   │
│          ▼                                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Next.js App Router (Dashboard)             │   │
│  │                                                      │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Server Components (zero client JS)            │  │   │
│  │  │  • Story cards with source badges              │  │   │
│  │  │  • Source health panel                         │  │   │
│  │  │  • Stats bar (stories today, sources, etc.)    │  │   │
│  │  │  • Classification banner                       │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Client Components ('use client')              │  │   │
│  │  │  • Source filter buttons                       │  │   │
│  │  │  • Time range selector                         │  │   │
│  │  │  • Search input                                │  │   │
│  │  │  • Mobile tab navigation                       │  │   │
│  │  │  • Auto-refresh polling (60s interval)         │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Vercel AI Gateway                          │   │
│  │                                                      │   │
│  │  OIDC auth (no API keys)                             │   │
│  │  → Claude Haiku                                      │   │
│  │  → Cost tracking + observability                     │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

External Sources (read-only, no auth):

  ┌──────────────┐   ┌──────────────────┐
  │ Hacker News  │   │ GitHub Trending   │
  │ Firebase API │   │ HTML scrape       │
  │ (free)       │   │ (cheerio parse)   │
  └──────────────┘   └──────────────────┘
```

## Data Flow

### Fetch Cycle (every 15 minutes)

```
1. Vercel Cron triggers POST /api/fetch
   │
2. Fetch sources in parallel:
   │  ├── HN: GET /v0/topstories.json → batch fetch top 30 items
   │  └── GH: GET /trending/typescript, /trending/python, etc. → cheerio parse
   │
3. Load existing today's blob (feed/{date}.json) for URL dedup
   │
4. Filter new stories only (URL not in existing blob)
   │
5. AI processing (Claude Haiku via AI Gateway):
   │  ├── Relevance filter: "Is this tech news?" → boolean
   │  └── Title summary: "Why does this matter?" → one-liner
   │
6. Merge new stories into today's blob
   │
7. Write updated blob to Vercel Blob
   │
8. Update source health in meta/sources.json
```

### Dashboard Render (on page load)

```
1. Server Component reads last 7 days of blobs from Vercel Blob
   │
2. Merges and sorts stories (by score descending, then by recency)
   │
3. Renders story cards, source panel, stats bar as HTML (zero JS)
   │
4. Client Components hydrate for interactivity:
   │  ├── Source filter buttons
   │  ├── Time range selector (6H / 12H / 24H / 7D)
   │  ├── Search input
   │  └── Auto-refresh polling (fetches /api/stories every 60s)
```

### Cleanup (daily at midnight)

```
1. Vercel Cron triggers POST /api/cleanup
   │
2. List all blobs in feed/ prefix
   │
3. Delete any blob with date > 7 days ago
   │
4. Log cleanup results
```

## Storage Model

### Why Vercel Blob (Not a Database)

| Consideration | Database (Turso, Neon) | Vercel Blob |
|---------------|----------------------|-------------|
| Complexity | Schema, migrations, ORM | JSON files, `put`/`get`/`del` |
| Cost | Free tier then paid | Free tier covers 7 days of JSON |
| Query flexibility | Full SQL | Read full blob, filter in-memory |
| 7-day retention | Needs cleanup query | Delete old blobs |
| Deployment | Connection strings, pooling | `BLOB_READ_WRITE_TOKEN` auto-provisioned |

For a 7-day rolling window of ~200 stories/day, each daily blob is ~50-100KB. Total storage is under 1MB. A database is overkill.

### Blob Structure

```
feed/
  2026-04-01.json       # Array of Story objects for today
  2026-03-31.json       # Yesterday
  2026-03-30.json       # ...
  ...                   # Up to 7 days back
meta/
  sources.json          # Source health and status
```

### Story Schema

```typescript
interface Story {
  id: string;                                    // "hn-12345" or "gh-owner/repo"
  source: 'hackernews' | 'github-trending';
  title: string;
  url: string;                                   // Unique key for dedup
  score: number | null;                          // HN points or GH stars today
  author: string | null;
  description: string | null;
  tags: string[];                                // Languages, topics
  summary: string | null;                        // AI one-liner
  relevant: boolean;                             // AI tech relevance
  fetchedAt: string;                             // ISO timestamp
  publishedAt: string | null;
}
```

### Source Health Schema

```typescript
interface SourceHealth {
  sources: {
    [key: string]: {
      name: string;
      lastFetchAt: string | null;
      lastFetchCount: number;
      status: 'healthy' | 'degraded' | 'error';
      errorMessage: string | null;
      totalStoriesToday: number;
    };
  };
  updatedAt: string;
}
```

## API Routes

| Route | Method | Trigger | Purpose |
|-------|--------|---------|---------|
| `/api/fetch` | `POST` | Vercel Cron (*/15 * * * *) | Fetch all sources, AI process, store in blob |
| `/api/stories` | `GET` | Dashboard polling | Returns stories (query: `?source=hn&days=1`) |
| `/api/sources` | `GET` | Dashboard | Returns source health status |
| `/api/cleanup` | `POST` | Vercel Cron (0 0 * * *) | Delete blobs older than 7 days |

### Cron Security

All cron routes verify the `CRON_SECRET` header:
```typescript
if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## Rendering Strategy

### Server Components (Default — Zero Client JS)

Most of the dashboard renders server-side and ships no JavaScript:
- Story cards (title, summary, source badge, score, timestamp)
- Source health panel (status dots, last fetch time, story count)
- Stats bar (total stories, active sources, last update)
- Classification banner
- CRT scanlines overlay

### Client Components (Interactive Only)

Only interactive elements use `'use client'`:
- `<SourceFilter />` — filter stories by source
- `<TimeRange />` — select time window (6H / 12H / 24H / 7D)
- `<SearchInput />` — search stories by keyword
- `<MobileTabs />` — tab navigation on mobile
- `<AutoRefresh />` — polls `/api/stories` every 60 seconds

This keeps the initial page load minimal — most content is pre-rendered HTML.

## AI Processing

### What AI Does (Scoped and Simple)

1. **Relevance filter** — given a title and URL, is this tech-relevant? (yes/no)
2. **Title summary** — one-liner "why this matters to a developer" (max 100 chars)

### What AI Does NOT Do

- No full-article summarization (not fetching article content)
- No embedding/vector search
- No multi-turn reasoning
- No image analysis

### Cost Model

- ~50 stories/fetch cycle × ~200 input tokens × $0.80/MTok = ~$0.008 per cycle
- 96 cycles/day = ~$0.77/day = ~$23/month at full rate
- In practice, dedup means only ~10-20 new stories per cycle = **~$5-8/month**
- Batching stories into a single prompt reduces this further to **~$1-2/month**

### Prompt Strategy

Batch multiple titles into one prompt to minimize API calls:

```
You are a tech news relevance filter. Given these story titles, for each one:
1. Is it relevant to software engineering? (true/false)
2. One-line summary of why it matters (max 100 chars, or null if not relevant)

Stories:
1. "Show HN: I built a Rust compiler in 30 days"
2. "Why the housing market is crashing"
3. "Next.js 17 introduces server-only modules"

Respond as JSON array.
```

## Security

- **No API keys in code** — AI Gateway uses OIDC (auto-provisioned by Vercel)
- **Cron routes protected** — `CRON_SECRET` header verification
- **No user input** — dashboard is read-only, no forms, no auth needed
- **No PII** — stories are public data from public APIs
- **Blob access** — `BLOB_READ_WRITE_TOKEN` is server-side only

## Performance

| Metric | Target | How |
|--------|--------|-----|
| First load JS | < 80KB | RSC for most content, minimal client components |
| Dashboard load | < 1s | Blob reads are CDN-cached, RSC pre-renders |
| Fetch cycle | < 30s | Parallel source fetching, batched AI calls |
| Stories/day | ~200-500 | 30 from HN + 25 per language from GH × 4 languages |

## Failure Modes

| Failure | Impact | Handling |
|---------|--------|---------|
| HN API down | No new HN stories | `Promise.allSettled`, partial results ok, source status → degraded |
| GitHub HTML changes | No trending repos | try/catch, empty result, source status → error, log warning |
| AI Gateway error | No summaries | Stories still stored without summaries, retry next cycle |
| Blob write fails | Stories lost for this cycle | Retry next cycle (15 min), no data corruption risk |
| Cron doesn't fire | Feed goes stale | Dashboard shows "last fetch" timestamp, user can tell |

## Future Architecture (Phase 2+)

```
Phase 2 additions:
  ├── Reddit fetcher (r/programming, r/ClaudeAI)
  ├── Changelog monitors (Anthropic, Vercel, Node.js)
  └── Breaking change detection (AI flags breaking changes in changelogs)

Phase 3 additions:
  ├── Email digest (Resend, triggered by daily cron)
  ├── Bookmarking (stored in separate blob or cookie)
  ├── User-configurable tech stack profile
  └── Search with keyword highlighting
```
