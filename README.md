<div align="center">

# Sentinel Feed

**60 minutes of tech news. Distilled to 5.**

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Next.js-blue)](https://nextjs.org)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black)](https://vercel.com)

Your personal tech intelligence feed. AI-filtered. AI-summarized. Updated every 15 minutes.

<!-- <img src="docs/screenshots/dashboard.png" alt="Sentinel Feed Dashboard" width="900"> -->

</div>

---

## The problem

You're a developer. Every morning you open:
- **Hacker News** — 30 tabs, 20 minutes scrolling
- **GitHub Trending** — interesting repos buried in languages you don't use
- **Reddit** — r/programming, r/ClaudeAI, r/LocalLLaMA — another 15 minutes
- **Changelogs** — did Next.js ship a breaking change? Did Claude get a new model? You'll find out 3 days late

That's **60+ minutes** of context-switching across 5 sources. Most of it isn't relevant to your stack.

## The solution

**Sentinel Feed** pulls from all your sources every 15 minutes, uses Claude AI to filter for tech relevance and generate one-liner summaries, then presents everything in a Palantir-styled intelligence dashboard.

| Without Sentinel Feed | With Sentinel Feed |
|---|---|
| Open 5 tabs every morning | One dashboard shows everything |
| Scroll past politics, memes, drama | AI filters for tech relevance only |
| Miss framework breaking changes | Breaking change alerts front and center |
| 60 minutes to stay current | 5 minutes. Done. |

## What it looks like

A Palantir/sci-fi command center — same design language as [Claude Mission Control](https://github.com/Cyvid7-Darus10/claude-mission-control):

- Near-black palette with green/yellow/red status indicators
- Dense information panels with monospace typography
- Source health monitoring with pulsing status dots
- Classification banner: `SENTINEL FEED — INTERNAL USE ONLY`
- CRT scanlines overlay for that retro-futuristic feel
- Mobile responsive with tab navigation

## Features

- **Multi-source aggregation** — Hacker News, GitHub Trending, with more sources coming
- **AI relevance filtering** — Claude Haiku filters out non-tech noise
- **AI title summaries** — one-liner "why this matters" for every story
- **7-day rolling window** — always current, no stale data
- **Automatic updates** — Vercel Cron fetches every 15 minutes
- **Source health panel** — see when each source was last fetched and its status
- **Zero maintenance** — deployed on Vercel, runs itself

## Tech Stack

| Component | Choice |
|-----------|--------|
| Framework | Next.js (App Router, React Server Components) |
| UI | shadcn/ui + Tailwind CSS + JetBrains Mono |
| Storage | Vercel Blob (7-day JSON blobs) |
| AI | Vercel AI Gateway + Claude Haiku |
| Scheduling | Vercel Cron Jobs |
| Deployment | Vercel (zero config) |

**Estimated cost:** ~$1-2/month (Vercel Hobby + AI Gateway usage).

## Setup

### Prerequisites

- **Node.js 18+** (`node -v` to check)
- **Vercel account** (free Hobby plan works)
- **Vercel CLI** (`npm i -g vercel`)

### Quick Start

```bash
# Clone and install
git clone https://github.com/Cyvid7-Darus10/sentinel-feed.git
cd sentinel-feed
npm install

# Link to Vercel (creates project, enables AI Gateway)
vercel link
vercel env pull

# Run locally
npm run dev
```

### Deploy

```bash
# Push to GitHub — Vercel auto-deploys
git push origin main
```

Or deploy manually:
```bash
vercel --prod
```

## Project Structure

```
sentinel-feed/
├── docs/
│   ├── PLAN.md              # Project plan and roadmap
│   ├── ARCHITECTURE.md      # System architecture
│   ├── BRANDING.md           # Design system and visual identity
│   └── RESEARCH.md           # Competitive research and API notes
├── src/
│   └── app/
│       ├── layout.tsx        # Root layout (dark theme, fonts)
│       ├── page.tsx          # Dashboard (Server Components)
│       ├── api/
│       │   ├── fetch/        # Cron-triggered feed fetcher
│       │   ├── stories/      # Stories API endpoint
│       │   └── cleanup/      # 7-day blob cleanup
│       ├── components/       # UI components (shadcn/ui based)
│       └── lib/
│           ├── fetchers/     # HN, GitHub trending fetchers
│           ├── ai.ts         # AI Gateway summarization
│           └── storage.ts    # Vercel Blob operations
├── vercel.json               # Cron configuration
├── tailwind.config.ts        # Palantir theme tokens
└── package.json
```

## Roadmap

- [x] Phase 1: Core feed (HN + GitHub Trending + AI + Dashboard)
- [ ] Phase 2: More sources (Reddit, changelogs, release watchers)
- [ ] Phase 3: Delivery (email digest, bookmarks, search, configurable stack)

## Related Projects

- [Claude Mission Control](https://github.com/Cyvid7-Darus10/claude-mission-control) — real-time command center for Claude Code agents. Same developer, same design language.

## License

Apache 2.0 — see [LICENSE](LICENSE).
