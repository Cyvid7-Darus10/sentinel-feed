<div align="center">

<h1>Sentinel Feed</h1>

<p><strong>AI-curated tech intelligence radar for developers</strong></p>

<p>Aggregates 5 sources every 15 minutes. Auto-categorizes into 6 topic sectors. Flags critical security stories. Summarizes with AI. Three visualization modes: Radar, Map, and List.</p>

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](https://www.typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-000)](https://nextjs.org)
[![Live Demo](https://img.shields.io/badge/Live-sentinel--feed.pastelero.ph-34d399)](https://sentinel-feed.pastelero.ph)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCyvid7-Darus10%2Fsentinel-feed)

<br />

<img src="docs/screenshots/demo.gif" alt="Sentinel Feed — Demo" width="860" />

</div>

<br />

## Why Sentinel Feed?

Developers waste time cycling through Hacker News, GitHub Trending, Reddit, Lobsters, and Dev.to every day. Sentinel Feed consolidates all five into a single dashboard that fetches, deduplicates, categorizes, and ranks stories automatically — updated every 15 minutes, consumed in 5.

**Key features:**

- **Radar view** — circular tactical display with dots sized by score, critical stories pulsing red, and a rotating sweep line
- **Map view** — 6 topic sectors in a grid, each showing top stories with AI summaries and hover tooltips
- **List view** — full-detail feed sorted by score with topic tabs
- **Critical alerts** — CVEs, vulnerabilities, zero-days, and breaches are auto-detected and flagged
- **AI summaries** — optional one-liner descriptions powered by Claude Haiku
- **Source filtering** — toggle any combination of HN, GitHub, Lobsters, Dev.to, Reddit
- **Time ranges** — 6h, 12h, 24h, or 7d windows
- **Search** — instant full-text search across titles, summaries, authors, and tags
- **Mobile-responsive** — all three views adapt to any screen size

## Views

### Radar View

Stories plotted as dots in 6 topic sectors. Higher score = closer to center, larger dot. Critical stories (CVEs, vulnerabilities) pulse red with glow effects. CRT scanline overlay and rotating sweep line complete the tactical aesthetic.

<img src="docs/screenshots/radar-desktop.png" alt="Radar View" width="860" />

### Map View

All 6 topic sectors visible simultaneously. Each sector shows top stories with source badges, AI summaries, and scores. Hover any story for a full-detail tooltip. Click a sector to drill into List view.

<img src="docs/screenshots/map-desktop.png" alt="Map View" width="860" />

### List View

Traditional feed sorted by community score. Topic tabs filter by category. Each card shows title, AI summary, source badge, author, relative time, tags, and score.

<img src="docs/screenshots/list-desktop.png" alt="List View" width="860" />

### Topic Filtering

Click any topic tab to filter — here showing AI/ML stories:

<img src="docs/screenshots/topic-filter.png" alt="Topic Filter — AI/ML" width="860" />

### Mobile

All views are fully responsive. Radar labels scale for small screens, map sectors stack vertically, and filter bars scroll horizontally.

<p align="center">
  <img src="docs/screenshots/radar-mobile.png" alt="Radar Mobile" width="260" />
  &nbsp;&nbsp;&nbsp;
  <img src="docs/screenshots/map-mobile.png" alt="Map Mobile" width="260" />
</p>

## Sources

| Source | Data | Scoring | Auth |
|--------|------|---------|------|
| **Hacker News** | Top 30 stories via Firebase API | Upvotes | None |
| **GitHub Trending** | Trending repos in TypeScript, Python, Go, Rust | Stars gained today | None |
| **Lobsters** | Top 25 stories via JSON API | Upvotes | None |
| **Dev.to** | Top 30 articles of the day | Reactions | None |
| **Reddit** | r/programming, r/netsec, r/devops (15 each) | Upvotes | None |

All sources are free, require no API keys, and are fetched in parallel with independent error handling — one source failing doesn't block the others.

## Topic Categorization

Stories are automatically classified into six sectors using keyword and tag matching:

| Sector | Color | What it catches |
|--------|-------|-----------------|
| **Security** | Red | CVEs, vulnerabilities, breaches, auth, privacy, malware |
| **AI / ML** | Purple | LLMs, models, training, OpenAI, Anthropic, diffusion |
| **Systems** | Blue | Compilers, kernels, databases, hardware, quantum |
| **Dev** | Green | Languages, frameworks, libraries, frontend, backend |
| **Tools** | Yellow | DevOps, CI/CD, cloud, Docker, Kubernetes, infrastructure |
| **General** | Gray | Everything else |

## Critical Alert Detection

Stories matching security-critical patterns are automatically flagged:

- CVE identifiers (`CVE-2024-XXXX`)
- Vulnerability disclosures, exploits, zero-days
- Ransomware, backdoors, supply chain attacks
- Remote code execution (RCE)
- Breaches and critical patches

These appear as pulsing red dots in Radar view and trigger the **CRITICAL ALERTS DETECTED** banner.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Components) |
| Language | TypeScript 5 |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) + JetBrains Mono |
| Storage | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) (JSON, 7-day rolling window) |
| AI | [Vercel AI SDK](https://sdk.vercel.ai) + Claude Haiku (optional) |
| Scheduling | [Vercel Cron](https://vercel.com/docs/cron-jobs) (every 15 min) |
| Visualization | Pure SVG + CSS (no charting libraries) |

## Getting Started

### Prerequisites

- **Node.js 18+**
- A [Vercel](https://vercel.com) account (free Hobby plan works)

### Installation

```bash
git clone https://github.com/Cyvid7-Darus10/sentinel-feed.git
cd sentinel-feed
npm install
```

### Environment Variables

Set in `.env.local` for local development, or in the Vercel dashboard for production:

| Variable | Required | Description |
|----------|----------|-------------|
| `BLOB_READ_WRITE_TOKEN` | Yes | Vercel Blob storage token |
| `CRON_SECRET` | Yes | Secret for authenticating cron job requests |
| `ANTHROPIC_API_KEY` | No | Enables AI-powered summaries and relevance filtering |
| `ENABLE_AI_ENRICHMENT` | No | Set to `false` to disable AI entirely (default: enabled) |

### Local Development

```bash
npm run dev
```

Trigger a manual fetch to populate data:

```bash
curl http://localhost:3000/api/fetch \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Deployment

Push to GitHub with Vercel linked for automatic deploys, or deploy manually:

```bash
vercel --prod
```

### Running Costs

| Configuration | Estimated Monthly Cost |
|--------------|----------------------|
| Without AI | **$0** — Vercel Hobby free tier covers cron + blob storage |
| With AI (Claude Haiku) | **$3 -- 5** — batch capped at 50 stories per cycle |

Set a spend limit under **Vercel > Settings > Billing > Spend Management** to avoid surprises.

## Project Structure

```
sentinel-feed/
├── src/
│   ├── app/
│   │   ├── page.tsx                # Dashboard entry (server component + JSON-LD)
│   │   ├── layout.tsx              # Root layout, fonts, SEO metadata
│   │   ├── globals.css             # Theme tokens, radar animations, tooltips
│   │   ├── robots.ts               # robots.txt generation
│   │   ├── sitemap.ts              # sitemap.xml generation
│   │   ├── manifest.ts             # PWA web manifest
│   │   └── api/
│   │       ├── fetch/route.ts      # Cron: fetch sources → AI enrich → store
│   │       ├── stories/route.ts    # GET /api/stories — filtered story list
│   │       ├── sources/route.ts    # GET /api/sources — source health status
│   │       └── cleanup/route.ts    # Cron: prune blobs older than 7 days
│   ├── components/
│   │   ├── tactical-map.tsx        # Main dashboard — filters, view switching
│   │   ├── radar-view.tsx          # Radar — SVG circle, dots, sweep, tooltips
│   │   ├── sector-map.tsx          # Map — topic grid with story cards
│   │   └── story-node.tsx          # List — story card with score + meta
│   └── lib/
│       ├── fetchers/
│       │   ├── index.ts            # Parallel fetcher orchestration + dedup
│       │   ├── hackernews.ts       # Hacker News Firebase API
│       │   ├── github-trending.ts  # GitHub Trending HTML parser
│       │   ├── lobsters.ts         # Lobsters JSON API
│       │   ├── devto.ts            # Dev.to articles API
│       │   └── reddit.ts           # Reddit JSON API (3 subreddits)
│       ├── ai.ts                   # AI enrichment — summaries + filtering
│       ├── storage.ts              # Vercel Blob CRUD operations
│       ├── topics.ts               # Keyword-based topic classification
│       ├── types.ts                # Shared TypeScript interfaces
│       └── utils.ts                # Date formatting, URL normalization
├── public/
│   └── og-image.png               # Open Graph preview image
├── scripts/
│   └── screenshots.mjs            # Playwright screenshot automation
├── vercel.json                     # Cron job schedules
└── vitest.config.ts                # Test runner configuration
```

## Adding a Source

Each source is a single file that returns `Story[]`:

1. Create `src/lib/fetchers/your-source.ts` — export an async function returning `Promise<Story[]>`
2. Add your source ID to the `SourceId` union in `src/lib/types.ts`
3. Register the fetcher in `src/lib/fetchers/index.ts`
4. Add the display name mapping in `src/app/api/fetch/route.ts`
5. Add to the valid sources set in `src/app/api/stories/route.ts`
6. Add filter button + badge styles in the UI components

See any existing fetcher (e.g., `lobsters.ts`) as a reference — most are under 60 lines.

## Contributing

Contributions are welcome:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-source`)
3. Write tests first, then implement
4. Verify all tests pass (`npm test`)
5. Open a pull request

## License

[Apache 2.0](LICENSE)
