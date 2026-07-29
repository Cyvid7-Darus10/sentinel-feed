# Sentinel Feed

Seven developer news sources fetched on a cron, deduplicated, enriched by one
batched Haiku call, stored as daily JSON blobs, and read back by a Next.js
dashboard. There is no server process and no database.

Read `docs/ARCHITECTURE.md` before changing anything in `src/lib/` or
`src/app/api/`. `docs/BRANDING.md` covers the design tokens and the reasoning
behind them; read it before touching `globals.css`.

## Commands

```bash
npm run dev         # Dev server
npm test            # Vitest, run once
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run build       # Production build
```

All four of `test`, `lint`, `typecheck`, and `build` must pass before a commit.

## Layout

| Path | What lives there |
|------|------------------|
| `src/app/api/` | Two cron routes (`fetch`, `cleanup`) and two public read routes (`stories`, `sources`) |
| `src/lib/fetchers/` | One file per source, each returning `Story[]` |
| `src/lib/` | Pure modules: ranking, topics, classification, radar geometry, storage, config |
| `src/components/` | `atoms` → `molecules` → `organisms` → `templates`, plus `hooks` |
| `docs/` | Architecture and branding notes, screenshots, logo source art |
| `scripts/` | Playwright screenshot and GIF capture for the README (needs `playwright` installed separately) |

## Conventions

- TypeScript strict. No `any` — use `unknown` and narrow it.
- No mutation. Return new objects and arrays; `Story` and friends are `readonly`.
- Tests come first. Every fetcher covers the empty and malformed responses, not
  just the happy path.
- Comments explain *why*, not *what*. If the code needs a comment to say what it
  does, rewrite the code.
- Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`).
  No attribution footers in commit messages.
- Constants that would otherwise be magic numbers go in `src/lib/config.ts`.

## Things that will bite you

- **Every path must degrade without AI.** The app has to behave exactly as it
  does today when `ENABLE_AI_ENRICHMENT=false`, when no API key is set, when a
  batch throws, and when stored blobs predate a field. `Story.topic` and
  `Story.importance` are nullable for exactly this reason, and every reader
  falls back.
- **Dedup runs before enrichment.** That ordering is what keeps the model bill in
  the single-digit dollars per month. Do not reorder it.
- **Cost.** One batched Haiku call per cron cycle, over genuinely new stories
  only. Adding a second model call to the pipeline needs a real justification.
- **`/embed` is deliberately frameable.** The framing headers in `next.config.ts`
  exclude it on purpose; the rest of the app denies framing outright.
- **Adding a source touches five files.** See the checklist in
  [CONTRIBUTING.md](CONTRIBUTING.md).

<!-- BEGIN:nextjs-agent-rules -->
## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
