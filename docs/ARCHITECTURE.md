# Architecture

There is no server and no database. Two Vercel Cron schedules hit two route handlers, those handlers write JSON blobs, and Next.js reads the blobs back on render. That is the whole system.

```
Vercel Cron ──*/15 * * * *──> GET /api/fetch ──┐
            ──0 0 * * *────> GET /api/cleanup ─┤
                                               ▼
                                        Vercel Blob
                                        feed/2026-07-25.json
                                        feed/2026-07-24.json   (7 days back)
                                        meta/sources.json
                                               │
                                               ▼
                            Next.js App Router (RSC first render)
                                               │
                            client polls /api/stories + /api/sources every 60s
```

The seven upstream sources are all public and unauthenticated: Hacker News (Firebase REST), GitHub Trending (HTML, parsed with cheerio), Lobsters (JSON), Dev.to (Forem REST), daily.dev (GraphQL), Techmeme and InfoQ (RSS).

## The fetch cycle

`GET /api/fetch` runs every 15 minutes with `maxDuration = 60`.

1. `verifyCronAuth` checks the `Authorization: Bearer $CRON_SECRET` header and returns a 401 response object if it does not match. Everything below is skipped on failure.
2. Read today's blob and build a `Set` of normalized URLs from it.
3. `fetchAllSources` runs all seven fetchers concurrently under `Promise.allSettled`. Each fetcher is also individually wrapped in try/catch, so a thrown error becomes `{ source, stories: [], error: message }` instead of taking down the cycle. Every fetcher passes `AbortSignal.timeout(FETCHER_TIMEOUT_MS)` to `fetch`, currently 10 seconds.
4. Each fetcher's results are filtered against the existing URL set, then `dedupeStoriesByUrl` collapses the combined list. Both passes are needed: the first catches a story already stored from an earlier cycle, the second catches the same link arriving from HN and Lobsters in the same run.
5. `enrichStories` splits everything into concurrent batches of 50 and asks Claude Haiku for a relevance boolean, a one-line summary, a topic, and an importance weight per story. The batch size bounds prompt length, not total spend; every story gets analyzed.
6. Anything marked `relevant: false` is dropped. The rest is appended to today's blob.
7. Per-source health goes to `meta/sources.json`: last fetch time, count, status, error message, running total for the day.

Two properties fall out of this ordering that are worth keeping. Dedup runs before enrichment, so a story is never paid for twice. And AI failure is not fatal: a batch that throws returns its own stories untouched, so a Gateway blip costs summaries on part of one cycle rather than the whole run.

## Render

`src/app/page.tsx` is a server component with `dynamic = 'force-dynamic'`. It reads today's stories and the health blob in parallel and hands both to `<TacticalMap>` as props, so the first paint has real content in the HTML.

From there the client takes over. `useStoryFeed` polls `/api/stories?days=N` and `/api/sources` on a 60-second interval, seeded with the server's data so there is no empty flash. The hook tracks a `cancelled` flag because changing the time range re-runs the effect, and a slow in-flight response from the old range must not overwrite the new one. A 429 from either endpoint flips a `rateLimited` flag and the UI says so rather than silently going stale.

Everything below `<TacticalMap>` is client-side: three view components (radar, sector map, list), the toolbar, and the filters. The radar layout itself is computed by `src/lib/radar-geometry.ts`, which is pure and covered by tests.

## Cleanup

`GET /api/cleanup` runs at midnight, same auth check. It pages through `list({ prefix: 'feed/' })` with a cursor, matches `YYYY-MM-DD.json` out of each pathname, and deletes anything with a date string older than the cutoff. String comparison works here because ISO dates sort lexicographically.

## Storage

### Why blobs and not a database

At roughly 200 stories a day, a daily blob lands around 50 to 100 KB, and a 7-day window is under 1 MB total. Against that, a database means a schema, migrations, an ORM, a connection string, and pooling. The queries the app needs are "give me the last N days" and "filter by source", both of which are a `.filter()` over an array already in memory.

| | Database | Vercel Blob |
|---|---|---|
| Setup | Schema, migrations, ORM, pooling | `put`, `head`, `list`, `del` |
| Retention | Scheduled delete query | Delete old blobs |
| Credentials | Connection string to manage | `BLOB_READ_WRITE_TOKEN` auto-provisioned |
| Cost at this size | Free tier, then paid | Free tier covers it |

The tradeoff is real: there is no partial write, no transaction, and no query beyond reading the whole file. At a couple hundred KB, none of that has bitten yet. It would at ten times the volume.

### Layout

```
feed/
  2026-07-25.json   # array of Story, today
  2026-07-24.json   # yesterday, back 7 days
meta/
  sources.json      # SourceHealth
```

Writes use `addRandomSuffix: false` and `allowOverwrite: true` so the path stays predictable and today's blob is replaced in place rather than accumulating versions.

### Shapes

```typescript
type SourceId =
  | 'hackernews' | 'github-trending' | 'lobsters'
  | 'devto' | 'dailydev' | 'techmeme' | 'infoq';

interface Story {
  readonly id: string;              // 'hn-12345', 'lo-abc123'
  readonly source: SourceId;
  readonly title: string;
  readonly url: string;             // dedup key, after normalizeUrl()
  readonly score: number | null;    // upvotes, stars, reactions, per source
  readonly author: string | null;
  readonly description: string | null;
  readonly tags: readonly string[];
  readonly summary: string | null;  // AI one-liner, null when disabled
  readonly relevant: boolean;
  readonly fetchedAt: string;       // ISO
  readonly publishedAt: string | null;
  readonly topic: string | null;    // AI-assigned sector, null until enriched
  readonly importance: number | null; // AI-assigned 0-100 weight, null until enriched
}

interface SourceStatus {
  readonly name: string;
  readonly lastFetchAt: string | null;
  readonly lastFetchCount: number;
  readonly status: 'healthy' | 'degraded' | 'error';
  readonly errorMessage: string | null;
  readonly totalStoriesToday: number;
}
```

## Routes

| Route | Method | Called by | Does |
|-------|--------|-----------|------|
| `/api/fetch` | GET | Cron, `*/15 * * * *` | Fetch, dedup, enrich, store |
| `/api/stories` | GET | Client poll | `?days=1..7`, `?source=<SourceId>`, sorted by score then recency |
| `/api/sources` | GET | Client poll | Source health blob |
| `/api/cleanup` | GET | Cron, `0 0 * * *` | Delete blobs past the retention window |

Both read routes send the shared `PUBLIC_GET_HEADERS` from `config.ts`, which carries `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`. The CDN absorbs the polling, so the origin sees roughly one request per minute regardless of how many tabs are open.

Both cron routes go through `verifyCronAuth`, which compares the bearer token to `CRON_SECRET` and logs a warning noting only whether a header was present. The token itself never reaches the logs.

Input validation on `/api/stories` is deliberately narrow. `source` is checked against `VALID_SOURCE_SET` and dropped if it does not match, and `days` is parsed, `NaN`-guarded, and clamped to 1 through 7. Nothing from the query string reaches a blob path.

## Ranking

Raw source scores are not comparable. An HN story with 400 upvotes and a Dev.to post with 40 reactions are both near the top of their respective sources, and Techmeme and InfoQ have no score at all, so sorting on the raw number pins every RSS story to the bottom forever.

`ranking.ts` fixes that with a rank in `[0, 1]`, blended 50/50 from two parts: the story's score percentile *within its own source*, and the AI-assigned importance. Percentile-within-source is what makes upvotes and reactions comparable; importance is what lets score-less sources compete. Ties use the midrank, so an all-tied group does not collapse to zero.

Both halves degrade independently. No importance falls back to percentile alone, which is the pre-upgrade behavior. No score falls back to importance alone. Neither gives 0. Stored blobs are read back without re-validation, so importance that is missing, non-finite, or out of range is treated as absent rather than trusted.

Rank drives ordering in every view and the radius on the radar. It is never displayed: the number on a card is still the raw source score, because "412 points on HN" means something to a reader and "0.83" does not.

## Classification

Topic assignment has two layers; the critical-alert pass has none, and neither calls a model at read time.

`resolveTopic` prefers the AI-assigned topic from enrichment and falls back to `categorizeTopic`, the keyword regex, whenever the AI topic is missing or is not one of the six known sectors. That covers AI-off, failed batches, and blobs stored before the field existed. The regex assigns exactly one sector by testing the title, description, and tags in a fixed order, first match wins: security, then AI, then systems, then tools, then dev, with general as the fallback. A story about a Kubernetes CVE lands in security, not tools.

`classification.ts` is separate and orthogonal. It flags critical security stories by regex, independent of which sector the story landed in. Regex rather than a model call is a cost and latency decision. Also a correctness one: the CVE pattern either matches or it does not, which is not something a summarizer should get a vote on.

## What the AI does and does not do

It does four things, all in a single batched call per cycle: decide whether a story is relevant to software engineers, write a one-line reason it matters capped at 120 characters, pick one of the six topic sectors, and assign a 0-100 importance weight. `temperature: 0`, structured output validated by a zod schema through `Output.array`.

Each story is serialized into the prompt as its own isolated JSON object, one per line, so a title or description cannot break out of its string and steer the model's read of another story.

It does not fetch or summarize article bodies, generate embeddings, do multi-turn reasoning, or touch images.

The output length is checked against the input length. If the model returns a different number of results, that batch falls back to neutral defaults (`relevant: true`, no summary) rather than risking a misaligned zip that would attach the wrong summary to the wrong story. Keeping an unsummarized story is cheap; mislabeling one is not.

Both fallback paths fail open, letting unfiltered stories through, which is the right direction for a news feed but does mean a persistent AI outage shows up as a noisier feed rather than an empty one. That is why the batch failure logs a warning.

Cost stays low because dedup runs first: a full cold run is around 170 candidates, but a steady-state cycle usually has 10 to 20 genuinely new stories. That lands in the low single digits of dollars per month. Setting `ENABLE_AI_ENRICHMENT=false` skips the calls entirely and the app still works, just without summaries.

## Security posture

The app has no users, no auth, no forms, and no writes from the browser. That removes most of the usual surface area. What is left:

- `CRON_SECRET` gates both write routes.
- `BLOB_READ_WRITE_TOKEN` is server-side only and never crosses into a client component.
- Story URLs pass through `isSafeUrl` before being rendered as links, which keeps `javascript:` and other non-http schemes out of `href`.
- Story data is public information from public APIs. No PII is stored, and none is sent to Anthropic beyond titles and descriptions.
- Error responses to clients are generic. Details go to `console.error` on the server.

## Failure modes

| What breaks | Effect | What happens |
|---|---|---|
| One source is down or times out | That source contributes nothing this cycle | `Promise.allSettled` plus a per-fetcher catch, status flips to `error` with the message on `/api/sources` |
| GitHub changes its trending markup | Cheerio selectors return nothing | Fetcher throws or returns empty, same handling as above, visible in source health |
| AI Gateway errors | No summaries for the affected batch | `enrichBatch` catches per batch and passes its stories through with `relevant: true`, logging a warning since those skip the filter |
| Blob write fails | This cycle's stories are lost | Next cycle re-fetches, nothing is half-written since each write is a whole-file replace |
| Blob read fails | Empty feed | Every read path returns `[]` or a default health object rather than throwing |
| Cron does not fire | Feed goes stale | Last-fetch timestamp is on screen, so it is visible rather than silent |
| The dashboard throws while rendering | Fallback UI with a retry button | `src/app/error.tsx`. The page is `force-dynamic` and reads blob storage on render, so a storage outage lands here instead of blanking the document |
| The root layout itself throws | Standalone fallback document | `src/app/global-error.tsx`. It replaces the layout, so `globals.css` and the font are gone and every style in it is inline |
| Unknown route | 404 page, not indexed | `src/app/not-found.tsx` |

Error digests are shown but messages are not. Next.js already redacts server-side error messages in production; the digest is what matches a report to the server log.
