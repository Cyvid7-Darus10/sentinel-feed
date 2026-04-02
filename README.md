<div align="center">

# Sentinel Feed

**Your dev news. One place. Five minutes.**

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black)](https://vercel.com)

An open-source tech news aggregator that pulls from 5 sources, categorizes by topic, and optionally summarizes with AI — so you can stay current without tab hopping.

</div>

---

## Why

Every morning you open HN, GitHub Trending, Reddit, Lobsters, Dev.to — scroll for an hour, switch tabs, lose context. Most of it isn't relevant to your stack.

Sentinel Feed pulls from all of them every 15 minutes, deduplicates, categorizes into topics (Security, AI/ML, Systems, Dev, Tools), and presents a single feed sorted by community score. Optional AI summaries tell you *why* each story matters.

## Features

- **5 sources** — Hacker News, GitHub Trending, Lobsters, Dev.to, Reddit (r/programming, r/netsec, r/devops)
- **Topic categorization** — stories auto-sorted into Security, AI/ML, Systems, Dev, Tools, General
- **Community scoring** — HN upvotes, GitHub stars, Reddit karma, Dev.to reactions, Lobsters votes
- **AI summaries** (optional) — Claude Haiku generates one-liner "why this matters" per story
- **Relevance filtering** (optional) — AI filters out non-tech noise
- **Time range filters** — 6h, 12h, 24h, 7d views
- **Source filters** — view one source or all
- **Auto-refresh** — cron every 15 min, client polls every 60s
- **7-day retention** — rolling window, old data auto-cleaned

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + JetBrains Mono |
| Storage | Vercel Blob |
| AI | Vercel AI SDK + Claude Haiku (optional) |
| Scheduling | Vercel Cron |
| Hosting | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Vercel](https://vercel.com) account (free Hobby plan works)

### Setup

```bash
git clone https://github.com/Cyvid7-Darus10/sentinel-feed.git
cd sentinel-feed
npm install
```

### Environment Variables

Create a `.env.local` or set these in Vercel:

| Variable | Required | Description |
|----------|----------|-------------|
| `BLOB_READ_WRITE_TOKEN` | Yes | Vercel Blob storage token |
| `CRON_SECRET` | Yes | Secret for authenticating cron requests |
| `ANTHROPIC_API_KEY` | No | Enables AI summaries via Vercel AI Gateway |
| `ENABLE_AI_ENRICHMENT` | No | Set to `false` to disable AI (default: enabled) |

### Run Locally

```bash
npm run dev
```

The feed won't have data until the fetch endpoint is triggered. Hit it manually:

```bash
curl -X GET http://localhost:3000/api/fetch \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Deploy

Push to GitHub — Vercel auto-deploys if linked. Or deploy manually:

```bash
vercel --prod
```

### Cost

- **Without AI**: $0 (Vercel Hobby free tier covers cron + blob)
- **With AI**: ~$3-5/month (Haiku is cheap, batch cap of 50 stories/cycle)
- Set spend limits in **Vercel > Settings > Billing > Spend Management**

## Project Structure

```
sentinel-feed/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Dashboard (server component)
│   │   ├── globals.css             # Theme and styles
│   │   └── api/
│   │       ├── fetch/route.ts      # Cron: fetch all sources + AI enrich
│   │       ├── stories/route.ts    # GET stories with filters
│   │       ├── sources/route.ts    # GET source health status
│   │       └── cleanup/route.ts    # Cron: delete blobs older than 7d
│   ├── components/
│   │   ├── tactical-map.tsx        # Main dashboard (client component)
│   │   └── story-node.tsx          # Individual story card
│   └── lib/
│       ├── fetchers/
│       │   ├── index.ts            # Fetcher orchestration + dedup
│       │   ├── hackernews.ts       # HN top stories API
│       │   ├── github-trending.ts  # GitHub trending HTML scraper
│       │   ├── lobsters.ts         # Lobsters hottest JSON API
│       │   ├── devto.ts            # Dev.to top articles API
│       │   └── reddit.ts           # Reddit JSON API (3 subreddits)
│       ├── ai.ts                   # AI enrichment (summaries + filtering)
│       ├── storage.ts              # Vercel Blob read/write
│       ├── topics.ts               # Topic categorization engine
│       ├── types.ts                # Shared TypeScript types
│       └── utils.ts                # Date helpers, URL normalization
├── vercel.json                     # Cron schedules
└── vitest.config.ts                # Test configuration
```

## Adding a New Source

1. Create `src/lib/fetchers/your-source.ts` exporting a `fetchYourSource(): Promise<Story[]>` function
2. Add your source ID to `SourceId` in `src/lib/types.ts`
3. Register the fetcher in `src/lib/fetchers/index.ts`
4. Add display name in `src/app/api/fetch/route.ts`
5. Add to valid sources in `src/app/api/stories/route.ts`
6. Add filter button in `src/components/tactical-map.tsx`
7. Add badge style in `src/components/story-node.tsx` and `globals.css`

## Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-source`)
3. Write tests first, then implement
4. Ensure `npm test` passes
5. Open a PR

## License

Apache 2.0 — see [LICENSE](LICENSE).
