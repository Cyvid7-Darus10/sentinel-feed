# Enrichment upgrade: real summaries, AI topics, source-independent ranking

**Date:** 2026-07-25
**Status:** Approved design, pending implementation plan

## Problem

Three content problems share one root cause — the enrichment pass extracts too
little from each story:

1. **Shallow summaries.** The Haiku call sees only the title and the first 120
   characters of the description, so summaries mostly restate the title.
2. **Misclassified topics.** Topics are assigned client-side by first-match
   regex (`categorizeTopic`), so "Go database internals" lands in Security if
   the text mentions "leak".
3. **Incomparable ranking.** Every view sorts by raw source score. HN upvote
   counts dwarf Dev.to reactions, and Techmeme/InfoQ stories (no score at all)
   sink to the bottom permanently.

This spec fixes all three inside the one batched model call the pipeline
already pays for. It is sub-project 1 of 3 (next: new sources, then
clustering + daily briefing), sequenced first because the upcoming score-less
sources need source-independent ranking to be visible at all.

## Constraints

- Monthly cost stays in the $3–5 band (Claude Haiku, Vercel Hobby tier).
- One batched enrichment call per cron cycle, over genuinely new stories only
  (dedup already guarantees this).
- The app must keep working unchanged when AI is disabled
  (`ENABLE_AI_ENRICHMENT=false` or no `ANTHROPIC_API_KEY`) and when an
  enrichment batch fails.

## Design

### 1. Data model (`src/lib/types.ts`)

`Story` gains two nullable fields:

```typescript
readonly topic: string | null;      // one of the six TOPICS ids
readonly importance: number | null; // 0–100, model-assigned editorial weight
```

No storage migration. The 7-day retention window ages out old blobs; until
then, readers treat a missing/`null` field as "fall back to current behavior."

### 2. Enrichment call (`src/lib/ai.ts`)

The batched call's output schema extends from `{relevant, summary}` to:

```typescript
const aiResultSchema = z.object({
  relevant: z.boolean(),
  summary: z.string().nullable(),
  topic: z.enum(['security', 'ai', 'systems', 'dev', 'tools', 'general']),
  importance: z.number().min(0).max(100),
});
```

Prompt changes:

- **Description preview grows 120 → 500 chars.** Fetchers already carry longer
  descriptions; the current prompt throws that context away.
- **Summary instruction** demands *what happened + why a developer should
  care*, and explicitly forbids restating the title. Length cap stays at 120
  chars.
- **Topic** is chosen from the six existing sector ids, with one-line
  definitions of each in the system prompt (mirroring the sector table in the
  README).
- **Importance** is defined as a source-independent editorial judgment: major
  releases, significant CVEs, industry-moving news score high; listicles,
  reposts, and routine patch releases score low. The prompt anchors the scale
  with examples (e.g. ~90 major model/framework release or actively exploited
  CVE, ~50 solid technical deep-dive, ~15 listicle).

Unchanged: `MAX_BATCH_SIZE = 50`, concurrent batches, temperature 0,
`Output.array` validation, length-mismatch bail to neutral defaults.

Failure semantics: a failed batch passes stories through with
`relevant: true, summary: null, topic: null, importance: null` — costs
quality, never stories.

### 3. Topic resolution (client fallback)

`categorizeTopic` regex stays. A new resolution helper is the single path all
components use:

```typescript
resolveTopic(story) = story.topic ?? categorizeTopic(story)
```

`categorizeStories` switches to it. AI-off and pre-migration stories keep
today's regex behavior exactly.

### 4. Ranking (`src/lib/ranking.ts`, new)

A pure, tested module (same style as `radar-geometry.ts`) computing a display
rank in [0, 1] for each story **over the loaded story set**:

```
rank = 0.5 * scorePercentileWithinSource + 0.5 * (importance / 100)
```

- `scorePercentileWithinSource`: the story's percentile among stories from the
  same source in the current set. This is what makes HN points and Dev.to
  reactions comparable — each story competes within its own source first.
- Degraded cases:
  - `importance == null` → percentile alone (approximates today's behavior).
  - `score == null` (Techmeme, InfoQ) → importance alone.
  - both null → 0 (sinks, as today).
- A single-story source gives that story percentile 1.0; acceptable at this
  volume.

Consumers switch from raw `score` to rank:

- List view sort order.
- Map sector story ordering (`categorizeStories` sort).
- Radar dot radius/size (`radar-geometry` input).

The raw score still displays on story cards (badge + score unit); rank is
ordering-only and never shown as a number.

### 5. Cost

Input tokens roughly double (500-char previews). At 10–20 new stories per
cycle on Haiku, monthly cost stays within $3–5. No new calls, no new
infrastructure.

## Error handling summary

| Failure | Behavior |
|---------|----------|
| AI disabled / no key | Stories store with `topic: null`, `importance: null`; regex topics + percentile ranking |
| Enrichment batch throws | Same passthrough, loud `console.warn` (existing pattern) |
| Output length mismatch | Neutral defaults for whole batch (existing pattern, extended to new fields) |
| Old stored stories lacking new fields | Readers treat `undefined` as `null`; ages out within 7 days |

## Testing (TDD, tests first)

- `ai.test.ts`: new schema fields parsed and attached; batch failure passes
  through with null topic/importance; length mismatch yields neutral defaults
  including new fields; 500-char preview truncation.
- `ranking.test.ts` (new): blended rank; percentile-only when importance
  missing; importance-only when score missing; both-null sinks; percentile is
  per-source, not global.
- `topics.test.ts`: `resolveTopic` prefers `story.topic`, falls back to regex
  when null/undefined.
- Existing tests must keep passing — views change their sort key, not their
  rendering contract.

## Out of scope (later sub-projects)

- New sources (AI vendor blogs, GitHub Releases, HF Papers, Reddit RSS,
  engineering blogs) — sub-project 2.
- Cross-source clustering and the daily briefing — sub-project 3.
- Full-article fetching for summaries — revisit only if excerpt-based
  summaries still feel thin after this ships.
