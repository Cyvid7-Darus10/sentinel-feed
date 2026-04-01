# Sentinel Feed — Project Plan

> Personal tech intelligence feed. AI-summarized news from HN, GitHub trending, changelogs, and more.
> Stay on top of tech updates in 5 minutes instead of 60.

## Background

Built as a companion to [Claude Mission Control](https://github.com/Cyvid7-Darus10/claude-mission-control) — the real-time command center for Claude Code agents. Same developer, same philosophy: minimal deps, fast, practical.

## Problem

Staying current with tech news is time-consuming:
- Hacker News, Reddit, GitHub trending, Twitter — too many sources
- Changelogs and breaking changes in frameworks you use get missed
- You find out about important updates days late
- Reading everything takes 60+ minutes/day

## Solution

A personal tech intelligence daemon that:
1. Aggregates from multiple sources on a schedule
2. AI-summarizes and ranks by relevance to YOUR stack
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
┌──────────────────────────────────────────────────────┐
│                  Sentinel Feed                        │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────┐  Cron/interval   ┌──────────────────┐  │
│  │ Sources  │ ───────────────► │  Fetcher Workers │  │
│  │ HN, GH,  │                  │  (per source)    │  │
│  │ Reddit.. │                  └────────┬─────────┘  │
│  └─────────┘                            │            │
│                                         ▼            │
│                              ┌──────────────────┐    │
│                              │  SQLite Storage   │    │
│                              │  articles, feeds  │    │
│                              └────────┬─────────┘    │
│                                       │              │
│                                       ▼              │
│                              ┌──────────────────┐    │
│                              │  AI Summarizer    │    │
│                              │  Claude API       │    │
│                              │  Rank + Summarize │    │
│                              └────────┬─────────┘    │
│                                       │              │
│                                       ▼              │
│                              ┌──────────────────┐    │
│                              │  Dashboard (Web)  │    │
│                              │  + Terminal CLI   │    │
│                              │  + Email digest   │    │
│                              └──────────────────┘    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Design Decisions

- **Start local, design for online** — run locally first, deploy later
- **Same stack as Mission Control** — Node.js, TypeScript, SQLite, vanilla dashboard
- **Minimal deps** — keep it lean
- **AI summarization** — use Claude API (Haiku for cost efficiency) to summarize and rank
- **Personalized** — configure your tech stack, get relevant news only

## Features (Priority Order)

### Phase 1: Core Feed
- [ ] Hacker News fetcher (top stories API — free, no auth)
- [ ] GitHub trending fetcher (scrape or API)
- [ ] SQLite storage for articles (dedup by URL)
- [ ] CLI output — `sentinel-feed` prints today's top stories
- [ ] Basic terminal dashboard (like Mission Control)

### Phase 2: AI Enhancement
- [ ] Claude API summarization (Haiku — cheap, fast)
- [ ] Relevance scoring based on your configured tech stack
- [ ] "Why this matters to you" one-liner per article
- [ ] Daily digest generation

### Phase 3: More Sources
- [ ] Reddit fetcher (r/programming, r/ClaudeAI)
- [ ] Anthropic/OpenAI/Vercel changelog monitors
- [ ] Node.js/framework release watchers
- [ ] Breaking change alerts

### Phase 4: Delivery
- [ ] Web dashboard with Palantir/Sentinel styling
- [ ] Email digest (morning brief)
- [ ] Mobile accessible (like Mission Control)
- [ ] Deploy as online app (Vercel/Railway)

## Tech Stack

| Component | Choice | Why |
|-----------|--------|-----|
| Runtime | Node.js + TypeScript | Same as Mission Control |
| Database | SQLite (`better-sqlite3`) | Embedded, familiar |
| AI | Claude API (Haiku) | Cheap summaries ($0.80/MTok) |
| HTTP | Node.js `http` or `fetch` | Built-in, no deps |
| Dashboard | Vanilla HTML/CSS/JS | Same pattern as Mission Control |
| Scheduling | `setInterval` or node-cron | Keep it simple |

## Research TODO

- [ ] Search GitHub for similar projects (tech news aggregators, AI summarizers)
- [ ] Check HN API docs (https://github.com/HackerNews/API)
- [ ] Check GitHub trending API/scraping options
- [ ] Check Reddit API requirements
- [ ] Evaluate existing tools: daily.dev, Feedly, Briefing, etc.
- [ ] Look at cost of Claude Haiku for ~50 summaries/day
