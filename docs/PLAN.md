# Sentinel Feed — Project Plan

> Personal tech intelligence feed. AI-summarized news from HN, GitHub trending, changelogs, and more.
> Stay on top of tech updates in 5 minutes instead of 60.

## Background

Built as a companion to [Claude Mission Control](https://github.com/Cyvid7-Darus10/claude-mission-control) — the real-time command center for Claude Code agents. Same developer, same design language: Palantir/sci-fi dark aesthetic.

## Problem

Staying current with tech news is time-consuming:
- Hacker News, Reddit, GitHub trending, Twitter — too many sources
- Changelogs and breaking changes in frameworks you use get missed
- You find out about important updates days late
- Reading everything takes 60+ minutes/day

## Solution

A personal tech intelligence daemon that:
1. Aggregates from multiple sources on a schedule (Vercel Cron)
2. AI filters for tech relevance and summarizes titles (Claude Haiku via AI Gateway)
3. Delivers a daily digest — read in 5 minutes
4. Alerts on breaking changes in tools you use

## Sources to Aggregate

| Source | What to Pull | Priority |
|--------|-------------|----------|
| **Hacker News** | Top/best stories, filtered by tech keywords | High |
| **GitHub Trending** | Repos trending in your languages (TypeScript, Python, Go, Swift) | High |
| **Anthropic Blog/Changelog** | Claude updates, API changes, new models | High |
| **OpenAI Blog** | GPT updates, API changes | Medium |
| **Vercel Blog/Changelog** | Next.js, AI SDK, platform updates | Medium |
| **Node.js Releases** | New versions, security patches | Medium |
| **Reddit** | r/programming, r/ClaudeAI, r/LocalLLaMA top posts | Medium |
| **X/Twitter** | Key accounts (Anthropic, OpenAI, Vercel, etc.) | Low (API cost) |
| **Dev.to / Hashnode** | Trending articles | Low |

## Architecture

```
Vercel Cron (every 15 min)
    |
    v
API Route: /api/fetch
    |-- Fetch HN top stories (Firebase API, free, no auth)
    |-- Fetch GitHub trending (scrape github.com/trending)
    |-- Dedup against existing data (by URL)
    |-- AI relevance filter + title summarization (Claude Haiku via AI Gateway)
    |-- Write to Vercel Blob (feed/{date}.json)

Dashboard (Next.js App Router + RSC)
    |-- Read last 7 days from Vercel Blob
    |-- Server Components: story cards, source panels, stats
    |-- Client Components: filters, search, bookmarks
    |-- SSE or polling for live updates

Cleanup (daily cron)
    |-- Delete blobs older than 7 days
```

## Tech Stack

| Component | Choice | Why |
|-----------|--------|-----|
| **Framework** | Next.js App Router | Vercel-native, RSC for minimal bundle, zero-config deploy |
| **UI** | shadcn/ui + Tailwind CSS | Fastest path to Palantir/sci-fi aesthetic with dark theme |
| **Font** | JetBrains Mono (via next/font) | Matches Mission Control's monospace aesthetic |
| **Storage** | Vercel Blob | No database needed — JSON blobs, 7-day retention |
| **AI** | Vercel AI Gateway + Claude Haiku | OIDC auth, ~$0.01-0.05/day for title summaries |
| **Scheduling** | Vercel Cron Jobs | Free on Hobby, triggers API routes |
| **Deployment** | Vercel | `git push` deploys, zero config |

### Why This Stack (Not Vanilla)

The original plan used vanilla HTML/CSS/JS + SQLite (same as Mission Control). After research, Next.js + shadcn/ui was chosen because:

1. **Vercel-native deployment** — vanilla Node.js servers can't deploy to Vercel (no long-running processes). Next.js is zero-config
2. **RSC = near-zero client JS** — story cards, panels, stats render server-side with zero bundle cost. Only interactive bits (filters, search) ship JS
3. **shadcn/ui dark theme** — building the Palantir sci-fi design system from scratch in vanilla CSS takes weeks. shadcn/ui + CSS variable overrides achieves the same look in hours
4. **Vercel Blob > SQLite** — Vercel Functions have ephemeral filesystems (SQLite files get wiped). Blob is durable, CDN-cached, and perfect for 7-day JSON storage
5. **AI Gateway** — OIDC auth (no API keys to manage), cost tracking, failover, observability. Just `model: 'anthropic/claude-haiku-4-5'` as a string
6. **Cron Jobs** — replace `setInterval`/`node-cron` with Vercel-managed scheduling. Free, reliable, no server needed

### Cost Estimate

| Service | Cost |
|---------|------|
| Vercel Hobby | Free |
| Vercel Blob (7 days of JSON) | Free tier |
| AI Gateway + Claude Haiku (~50 summaries/day) | ~$0.01-0.05/day |
| **Total** | **~$1-2/month** |

## Design Decisions

- **Palantir/sci-fi aesthetic** — same as Claude Mission Control
- **7-day retention only** — no historical data, keeps storage simple and cheap
- **AI does two things only**: (1) filter for tech relevance, (2) one-liner summary per title
- **Vercel Blob as data store** — daily JSON blobs (`feed/2026-04-01.json`), not a database
- **Dedup by URL** — within the 7-day window, no duplicate stories
- **SSE or polling** — simpler than WebSocket, Vercel-compatible

## Design System (Palantir/Sci-Fi)

Inherited from Claude Mission Control:

| Token | Value |
|-------|-------|
| `--bg-base` | `#0a0a0c` (darkest, page background) |
| `--bg-primary` | `#101114` (header, panels) |
| `--bg-panel` | `#161619` (panel bodies) |
| `--bg-hover` | `#222226` (hover state) |
| `--border` | `#252528` (dividers) |
| `--text-primary` | `#c8c8cc` (body text) |
| `--text-bright` | `#ededf0` (headers) |
| `--text-secondary` | `#7a7a80` (labels) |
| `--text-muted` | `#454549` (hints) |
| `--success` | `#4ade80` (active, green) |
| `--warning` | `#eab308` (alerts, yellow) |
| `--danger` | `#ef4444` (errors, red) |
| `--info` | `#94a3b8` (informational) |
| `--radius` | `0px` (sharp corners everywhere) |
| Font | JetBrains Mono + system sans-serif |
| Sizes | 10-14px scale |

### UI Elements
- Classification banner: "SENTINEL FEED — INTERNAL USE ONLY"
- CRT scanlines overlay (repeating-linear-gradient)
- Pulsing status dots for source health
- Glow effects on hover
- Dense panels with 1px borders
- Uppercase labels with letter-spacing
- 3px scrollbars
- Mobile: tab navigation (Sources / Feed / Bookmarks)

## Features (Priority Order)

### Phase 1: Core Feed + Dashboard
- [ ] Next.js project scaffold (App Router, shadcn/ui, Tailwind)
- [ ] Hacker News fetcher (top stories via Firebase API — free, no auth)
- [ ] GitHub trending fetcher (scrape github.com/trending)
- [ ] Vercel Blob storage (daily JSON blobs, URL dedup)
- [ ] AI relevance filter (Claude Haiku via AI Gateway — is this tech news?)
- [ ] AI title summarization (one-liner "why this matters")
- [ ] Vercel Cron Job (fetch every 15 min)
- [ ] Web dashboard with Palantir/sci-fi styling
- [ ] Source status panel (last fetch, story count, health)
- [ ] Story feed panel (cards with source badge, score, summary, age)
- [ ] Filters (by source, time range)
- [ ] Mobile responsive layout
- [ ] 7-day blob cleanup cron

### Phase 2: More Sources
- [ ] Reddit fetcher (r/programming, r/ClaudeAI)
- [ ] Anthropic/OpenAI/Vercel changelog monitors
- [ ] Node.js/framework release watchers
- [ ] Breaking change alerts

### Phase 3: Delivery + Polish
- [ ] Email digest (morning brief via Resend)
- [ ] Bookmarking system
- [ ] Search/filter by keyword
- [ ] User-configurable tech stack profile
- [ ] Deploy and share publicly

## Data Model

### Vercel Blob Structure

```
feed/
  2026-04-01.json     # Today's stories
  2026-03-31.json     # Yesterday
  ...                 # Up to 7 days
  sources.json        # Source health/status
```

### Story Object (in daily JSON blob)

```typescript
interface Story {
  id: string;              // "hn-12345" or "gh-owner-repo"
  source: 'hackernews' | 'github-trending';
  title: string;
  url: string;             // Unique key for dedup
  score: number | null;    // HN points or GitHub stars today
  author: string | null;
  description: string | null;
  tags: string[];          // Languages, topics
  summary: string | null;  // AI-generated one-liner
  relevant: boolean;       // AI-determined tech relevance
  fetchedAt: string;       // ISO timestamp
  publishedAt: string | null;
}
```

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/fetch` | `POST` | Triggered by cron — fetches all sources, processes, stores |
| `/api/stories` | `GET` | Returns stories (query: `source`, `days`) |
| `/api/sources` | `GET` | Returns source health/status |
| `/api/cleanup` | `POST` | Triggered by daily cron — deletes blobs > 7 days |

## Cron Configuration (vercel.json)

```json
{
  "crons": [
    { "path": "/api/fetch", "schedule": "*/15 * * * *" },
    { "path": "/api/cleanup", "schedule": "0 0 * * *" }
  ]
}
```

## Research References

See [RESEARCH.md](./RESEARCH.md) for full competitive analysis and API notes.

### Reusable Code (MIT-licensed patterns to copy)

| Pattern | Source Project | Key File |
|---------|---------------|----------|
| HN top stories fetcher | `vercel-labs/json-render` | `examples/chat/lib/tools/hackernews.ts` |
| GitHub trending scraper | `raycast/extensions` | `extensions/github-trending/src/lib/trending-github.ts` |
| GitHub trending + retry | `imsyy/DailyHotApi` | `src/routes/github.ts` |

### Dependencies for Fetching

| Package | Purpose |
|---------|---------|
| `cheerio` | Parse GitHub trending HTML (standard, MIT, v1.0.0) |
| `ai` | Vercel AI SDK for Claude Haiku summarization |
| `@ai-sdk/anthropic` | Anthropic provider for AI Gateway |

HN API needs no package — two `fetch()` calls against Firebase endpoints.

### Key Insight from Research
None of the existing projects combine all our requirements (AI filtering + Palantir dashboard + Vercel deploy). Building from scratch with proven fetch patterns (MIT-licensed) is the right call.

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| GitHub HTML structure changes | High | try/catch, graceful fallback, log warning |
| HN API temporary unavailability | Medium | Batch with Promise.allSettled, partial results ok |
| Vercel Blob read latency | Low | CDN-cached, conditional gets with ETags |
| AI Gateway rate limits | Low | Haiku is fast, batch requests, retry with backoff |

## Success Criteria (Phase 1)

- [ ] `git push` deploys to Vercel automatically
- [ ] Cron fetches stories from HN + GitHub every 15 min
- [ ] AI filters irrelevant stories and adds one-liner summaries
- [ ] Dashboard loads with Palantir/sci-fi styling at production URL
- [ ] Stories render with source badges, scores, summaries, timestamps
- [ ] Duplicate URLs rejected within 7-day window
- [ ] Source panel shows health status (last fetch, count, status dot)
- [ ] Blobs older than 7 days auto-deleted
- [ ] Mobile responsive with tab navigation
- [ ] Total monthly cost < $5
