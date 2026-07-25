# Enrichment Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add AI-assigned `topic` and `importance` to every story via the existing batched Haiku call, and rank all views by a source-independent blend of score percentile and importance.

**Architecture:** Two new nullable `Story` fields flow from the enrichment call (`src/lib/ai.ts`) through Blob storage to the views. A new pure module `src/lib/ranking.ts` converts raw per-source scores into comparable [0,1] ranks; `resolveTopic` in `src/lib/topics.ts` prefers the AI topic and falls back to the existing regex. Every degraded path (AI off, batch failure, old stored blobs) reproduces today's behavior.

**Tech Stack:** Next.js 16 App Router, TypeScript 5, Vitest, Vercel AI SDK (`generateText` + `Output.array`), Zod, Claude Haiku via AI Gateway.

**Spec:** `docs/superpowers/specs/2026-07-25-enrichment-upgrade-design.md`

## Global Constraints

- Monthly cost stays in the $3–5 band: exactly one batched Haiku call per cron cycle over new stories only; `MAX_BATCH_SIZE = 50`, model `anthropic/claude-haiku-4.5`, temperature 0 — all unchanged.
- App behaves exactly as today when `ENABLE_AI_ENRICHMENT === 'false'`, when no API key is set, when a batch throws, or when stored stories lack the new fields.
- No storage migration; readers treat missing/`null` `topic`/`importance` as "fall back to current behavior."
- Immutability everywhere: never mutate input arrays/objects; return new copies (matches existing codebase style).
- Conventional commits (`feat:`, `test:`, `refactor:`); no attribution footers.
- TDD: every task writes its failing test before the implementation.
- `npm test` and `npm run build` must pass at every commit.
- Raw source score remains what's *displayed* on cards; rank is ordering/geometry only and is never shown as a number.

---

### Task 1: `Story` fields + `createStory` defaults + fixture updates

**Files:**
- Modify: `src/lib/types.ts` (Story interface, after `score`)
- Modify: `src/lib/fetchers/create-story.ts`
- Test: `src/lib/fetchers/__tests__/create-story.test.ts` (create if the directory doesn't exist yet)
- Modify: every test fixture that builds a full `Story` literal (find them with the grep in Step 3)

**Interfaces:**
- Consumes: nothing (first task).
- Produces: `Story` gains `readonly topic: string | null` and `readonly importance: number | null` (both required properties, nullable values). `createStory` fills both with `null`. Every later task relies on these exact names.

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/fetchers/__tests__/create-story.test.ts
import { describe, it, expect } from 'vitest';
import { createStory } from '../create-story';

describe('createStory', () => {
  it('defaults topic and importance to null until enrichment fills them', () => {
    const story = createStory('hackernews', {
      id: 'hn-1',
      title: 'Test',
      url: 'https://example.com',
    });
    expect(story.topic).toBeNull();
    expect(story.importance).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/fetchers/__tests__/create-story.test.ts`
Expected: FAIL — `story.topic` is `undefined`, not `null` (and TypeScript may flag the property as nonexistent).

- [ ] **Step 3: Implement**

In `src/lib/types.ts`, inside `Story` after `readonly score: number | null;`:

```typescript
  /** AI-assigned sector id (one of TOPICS); null until enriched or when AI is off. */
  readonly topic: string | null;
  /** AI-assigned 0-100 editorial weight, source-independent; null until enriched. */
  readonly importance: number | null;
```

In `src/lib/fetchers/create-story.ts`, add to the returned object after `score`:

```typescript
    topic: null,
    importance: null,
```

Then fix every test fixture that builds a complete `Story` literal. Find them:

```bash
grep -rln "fetchedAt:" src --include='*.test.ts'
```

In each `makeStory`-style helper (e.g. `src/lib/__tests__/ai.test.ts:16`), add `topic: null, importance: null,` alongside the existing fields, keeping the `...overrides` spread last.

- [ ] **Step 4: Run the full suite and build**

Run: `npm test && npm run build`
Expected: PASS (the new test passes; nothing else changed behavior).

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/fetchers/create-story.ts src/lib/fetchers/__tests__/create-story.test.ts $(grep -rln "topic: null" src --include='*.test.ts')
git commit -m "feat: add topic and importance fields to Story"
```

---

### Task 2: `resolveTopic` with regex fallback

**Files:**
- Modify: `src/lib/topics.ts`
- Test: `src/lib/__tests__/topics.test.ts`

**Interfaces:**
- Consumes: `Story.topic` from Task 1; existing `categorizeTopic(story: Story): string` and `TOPICS`.
- Produces: `export function resolveTopic(story: Story): string` — returns `story.topic` when it is a known topic id, otherwise `categorizeTopic(story)`. Also: `categorizeStories` buckets by `resolveTopic` instead of `categorizeTopic`. Tasks 5–6 call `resolveTopic`.

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/__tests__/topics.test.ts` (reuse the file's existing story-builder helper; if it builds partial stories, extend with `topic` via overrides):

```typescript
describe('resolveTopic', () => {
  it('prefers the AI-assigned topic over the regex', () => {
    // Regex would say "security" (mentions "leak"); AI knows better.
    const story = makeStory({ title: 'Fixing a memory leak in Go', topic: 'systems' });
    expect(resolveTopic(story)).toBe('systems');
  });

  it('falls back to the regex when topic is null', () => {
    const story = makeStory({ title: 'New CVE in OpenSSL', topic: null });
    expect(resolveTopic(story)).toBe('security');
  });

  it('falls back to the regex when topic is not a known sector id', () => {
    const story = makeStory({ title: 'New CVE in OpenSSL', topic: 'not-a-topic' });
    expect(resolveTopic(story)).toBe('security');
  });

  it('categorizeStories buckets by the AI topic when present', () => {
    const story = makeStory({ title: 'Fixing a memory leak in Go', topic: 'systems' });
    const buckets = categorizeStories([story]);
    expect(buckets['systems']).toHaveLength(1);
    expect(buckets['security']).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/topics.test.ts`
Expected: FAIL — `resolveTopic` is not exported.

- [ ] **Step 3: Implement**

In `src/lib/topics.ts`:

```typescript
const TOPIC_ID_SET = new Set(TOPICS.map((t) => t.id));

/**
 * The AI-assigned topic wins when present and valid; the keyword regex is the
 * fallback for AI-off, failed-batch, and pre-upgrade stored stories.
 */
export function resolveTopic(story: Story): string {
  if (story.topic && TOPIC_ID_SET.has(story.topic)) return story.topic;
  return categorizeTopic(story);
}
```

In `categorizeStories`, change `const topicId = categorizeTopic(story);` to `const topicId = resolveTopic(story);`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/topics.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/topics.ts src/lib/__tests__/topics.test.ts
git commit -m "feat: resolve story topic from AI field with regex fallback"
```

---

### Task 3: `ranking.ts` — source-independent display rank

**Files:**
- Create: `src/lib/ranking.ts`
- Test: `src/lib/__tests__/ranking.test.ts`

**Interfaces:**
- Consumes: `Story` (with `topic`/`importance`) from Task 1.
- Produces:
  - `export function rankStories(stories: readonly Story[]): Map<string, number>` — story id → rank in [0, 1].
  - `export function sortStoriesByRank(stories: readonly Story[]): Story[]` — new array, rank descending, `fetchedAt` recency as tiebreak.
  - Rank formula: both signals → `0.5 * scorePercentileWithinSource + 0.5 * importance / 100`; importance null → percentile alone; score null → importance alone; both null → 0. Single scored story in a source → percentile 1.0.

- [ ] **Step 1: Write the failing tests**

```typescript
// src/lib/__tests__/ranking.test.ts
import { describe, it, expect } from 'vitest';
import type { Story } from '../types';
import { rankStories, sortStoriesByRank } from '../ranking';

function makeStory(overrides: Partial<Story> = {}): Story {
  return {
    id: 'hn-1',
    source: 'hackernews',
    title: 'Test Story',
    url: 'https://example.com',
    score: 100,
    author: null,
    description: null,
    tags: [],
    summary: null,
    relevant: true,
    topic: null,
    importance: null,
    fetchedAt: '2026-07-25T12:00:00Z',
    publishedAt: null,
    ...overrides,
  };
}

describe('rankStories', () => {
  it('blends per-source score percentile with importance 50/50', () => {
    const stories = [
      makeStory({ id: 'a', score: 10, importance: 100 }),
      makeStory({ id: 'b', score: 50, importance: 100 }),
      makeStory({ id: 'c', score: 90, importance: 100 }),
    ];
    const ranks = rankStories(stories);
    // Percentiles within hackernews: a=0, b=0.5, c=1. Importance term: 0.5 each.
    expect(ranks.get('a')).toBeCloseTo(0.5);
    expect(ranks.get('b')).toBeCloseTo(0.75);
    expect(ranks.get('c')).toBeCloseTo(1.0);
  });

  it('computes percentiles per source, not globally', () => {
    const stories = [
      makeStory({ id: 'hn-big', source: 'hackernews', score: 900 }),
      makeStory({ id: 'hn-small', source: 'hackernews', score: 10 }),
      makeStory({ id: 'devto-top', source: 'devto', score: 80 }),
      makeStory({ id: 'devto-low', source: 'devto', score: 5 }),
    ];
    const ranks = rankStories(stories);
    // 80 Dev.to reactions tops its source just like 900 HN points tops its own.
    expect(ranks.get('devto-top')).toBeCloseTo(ranks.get('hn-big')!);
  });

  it('uses percentile alone when importance is null', () => {
    const stories = [
      makeStory({ id: 'a', score: 10, importance: null }),
      makeStory({ id: 'b', score: 90, importance: null }),
    ];
    const ranks = rankStories(stories);
    expect(ranks.get('a')).toBeCloseTo(0);
    expect(ranks.get('b')).toBeCloseTo(1);
  });

  it('uses importance alone when score is null (RSS sources)', () => {
    const stories = [
      makeStory({ id: 'tm', source: 'techmeme', score: null, importance: 80 }),
    ];
    expect(rankStories(stories).get('tm')).toBeCloseTo(0.8);
  });

  it('ranks 0 when both score and importance are null', () => {
    const stories = [makeStory({ id: 'x', score: null, importance: null })];
    expect(rankStories(stories).get('x')).toBe(0);
  });

  it('gives a lone scored story in a source percentile 1.0', () => {
    const stories = [makeStory({ id: 'only', score: 3, importance: null })];
    expect(rankStories(stories).get('only')).toBe(1);
  });

  it('lets an important no-score story outrank a high-upvote fluff story', () => {
    const stories = [
      makeStory({ id: 'fluff', source: 'hackernews', score: 900, importance: 10 }),
      makeStory({ id: 'cve', source: 'techmeme', score: null, importance: 95 }),
    ];
    const ranks = rankStories(stories);
    expect(ranks.get('cve')!).toBeGreaterThan(ranks.get('fluff')!);
  });
});

describe('sortStoriesByRank', () => {
  it('sorts descending by rank without mutating the input', () => {
    const low = makeStory({ id: 'low', score: 10 });
    const high = makeStory({ id: 'high', score: 90 });
    const input = [low, high];
    const sorted = sortStoriesByRank(input);
    expect(sorted.map((s) => s.id)).toEqual(['high', 'low']);
    expect(input.map((s) => s.id)).toEqual(['low', 'high']);
  });

  it('breaks rank ties by fetchedAt recency', () => {
    const older = makeStory({ id: 'older', score: 50, fetchedAt: '2026-07-25T01:00:00Z' });
    const newer = makeStory({ id: 'newer', score: 50, fetchedAt: '2026-07-25T09:00:00Z' });
    const sorted = sortStoriesByRank([older, newer]);
    expect(sorted.map((s) => s.id)).toEqual(['newer', 'older']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/ranking.test.ts`
Expected: FAIL — module `../ranking` does not exist.

- [ ] **Step 3: Implement**

```typescript
// src/lib/ranking.ts
import type { Story } from './types';

/**
 * Display rank in [0, 1] for each story: the story's score percentile *within
 * its own source* blended 50/50 with the AI-assigned importance. Percentile-
 * within-source is what makes HN points and Dev.to reactions comparable;
 * importance is what lets score-less RSS sources (Techmeme, InfoQ) compete.
 *
 * Degraded cases: no importance → percentile alone (pre-upgrade behavior);
 * no score → importance alone; neither → 0.
 */
export function rankStories(stories: readonly Story[]): Map<string, number> {
  const percentiles = scorePercentilesBySource(stories);
  const ranks = new Map<string, number>();
  for (const story of stories) {
    ranks.set(story.id, blend(percentiles.get(story.id), story.importance));
  }
  return ranks;
}

/** New array sorted by rank descending, fetchedAt recency as the tiebreak. */
export function sortStoriesByRank(stories: readonly Story[]): Story[] {
  const ranks = rankStories(stories);
  return [...stories].sort((a, b) => {
    const diff = (ranks.get(b.id) ?? 0) - (ranks.get(a.id) ?? 0);
    if (diff !== 0) return diff;
    return new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime();
  });
}

function blend(
  percentile: number | undefined,
  importance: number | null
): number {
  // ?? null guards stories parsed from pre-upgrade blobs where the field is undefined.
  const imp = importance ?? null;
  if (percentile !== undefined && imp !== null) {
    return 0.5 * percentile + 0.5 * (imp / 100);
  }
  if (percentile !== undefined) return percentile;
  if (imp !== null) return imp / 100;
  return 0;
}

/** Percentile of each scored story among scored stories from the same source.
 *  Ties share a value; a source's lone scored story gets 1.0. */
function scorePercentilesBySource(
  stories: readonly Story[]
): Map<string, number> {
  const bySource = new Map<string, Story[]>();
  for (const story of stories) {
    if (story.score === null || story.score === undefined) continue;
    bySource.set(story.source, [...(bySource.get(story.source) ?? []), story]);
  }

  const percentiles = new Map<string, number>();
  for (const group of bySource.values()) {
    const scores = group.map((s) => s.score ?? 0);
    for (const story of group) {
      const below = scores.filter((v) => v < (story.score ?? 0)).length;
      percentiles.set(story.id, group.length > 1 ? below / (group.length - 1) : 1);
    }
  }
  return percentiles;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/ranking.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ranking.ts src/lib/__tests__/ranking.test.ts
git commit -m "feat: add source-independent story ranking"
```

---

### Task 4: Enrichment call returns topic + importance, deeper prompt

**Files:**
- Modify: `src/lib/ai.ts`
- Test: `src/lib/__tests__/ai.test.ts`

**Interfaces:**
- Consumes: `Story.topic`/`Story.importance` (Task 1).
- Produces: `enrichStories` (signature unchanged: `(stories: readonly Story[]) => Promise<Story[]>`) now fills `topic` and `importance` on success and leaves them `null` on every failure path. `DESCRIPTION_PREVIEW_LENGTH` becomes 500.

- [ ] **Step 1: Update the mock helper and write the failing tests**

In `src/lib/__tests__/ai.test.ts`, widen the `aiOutput` helper so existing calls keep compiling (fields optional) and new tests can pass them:

```typescript
/** Build a resolved generateText result with structured `output`. */
function aiOutput(
  results: Array<{
    relevant: boolean;
    summary: string | null;
    topic?: string;
    importance?: number;
  }>
) {
  return { output: results } as never;
}
```

(The `makeStory` helper already carries `topic: null, importance: null` from Task 1.)

Append these tests:

```typescript
  it('attaches AI-assigned topic and importance', async () => {
    mockGenerateText.mockResolvedValueOnce(
      aiOutput([
        { relevant: true, summary: 'Kernel patch', topic: 'systems', importance: 72 },
      ])
    );

    const result = await enrichStories([makeStory()]);

    expect(result[0].topic).toBe('systems');
    expect(result[0].importance).toBe(72);
  });

  it('leaves topic and importance null when the AI call throws', async () => {
    mockGenerateText.mockRejectedValueOnce(new Error('NoObjectGeneratedError'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await enrichStories([makeStory()]);

    expect(result[0].topic).toBeNull();
    expect(result[0].importance).toBeNull();
    warn.mockRestore();
  });

  it('leaves topic and importance null on a count mismatch', async () => {
    mockGenerateText.mockResolvedValueOnce(
      aiOutput([{ relevant: true, summary: 'Only one', topic: 'dev', importance: 50 }])
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await enrichStories([makeStory({ id: 'hn-1' }), makeStory({ id: 'hn-2' })]);

    expect(result[0].topic).toBeNull();
    expect(result[1].importance).toBeNull();
    warn.mockRestore();
  });

  it('sends up to 500 chars of description to the model', async () => {
    mockGenerateText.mockResolvedValueOnce(
      aiOutput([{ relevant: true, summary: 'ok', topic: 'dev', importance: 40 }])
    );
    const description = 'x'.repeat(600);

    await enrichStories([makeStory({ description })]);

    const call = mockGenerateText.mock.calls[0][0] as { prompt: string };
    expect(call.prompt).toContain('x'.repeat(500));
    expect(call.prompt).not.toContain('x'.repeat(501));
  });
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npx vitest run src/lib/__tests__/ai.test.ts`
Expected: the four new tests FAIL (`topic` is `null`/preview is 120 chars); all pre-existing tests still PASS.

- [ ] **Step 3: Implement**

In `src/lib/ai.ts`:

Change the preview constant:

```typescript
const DESCRIPTION_PREVIEW_LENGTH = 500;
```

Replace the schema and result type (strict Zod schema for model output; the widened `AiResult` covers neutral/failure defaults):

```typescript
const TOPIC_IDS = ['security', 'ai', 'systems', 'dev', 'tools', 'general'] as const;

const aiResultSchema = z.object({
  relevant: z.boolean(),
  summary: z.string().nullable(),
  topic: z.enum(TOPIC_IDS),
  importance: z.number().min(0).max(100),
});

interface AiResult {
  readonly relevant: boolean;
  readonly summary: string | null;
  readonly topic: string | null;
  readonly importance: number | null;
}
```

In `enrichBatch`, extend the success mapping:

```typescript
    return stories.map((story, i) => ({
      ...story,
      relevant: results[i]?.relevant ?? true,
      summary: normalizeSummary(results[i]?.summary),
      topic: results[i]?.topic ?? null,
      importance: results[i]?.importance ?? null,
    }));
```

(The catch branch's `return [...stories];` already leaves `topic`/`importance` null — `createStory` set them.)

In `batchAnalyze`, update the count-mismatch neutral defaults:

```typescript
    return stories.map(() => ({
      relevant: true,
      summary: null,
      topic: null,
      importance: null,
    }));
```

Replace the system prompt:

```typescript
    system: `You are a tech news analyst for software engineers. For each story, return:
- relevant: true if it relates to software engineering, programming, AI/ML, DevOps, or the tech industry; false otherwise.
- summary: one line (max ${MAX_SUMMARY_LENGTH} chars) stating what happened AND why a developer should care. Never restate the title. null when not relevant.
- topic: exactly one of:
  security (vulnerabilities, CVEs, breaches, auth, privacy, malware),
  ai (models, LLMs, training, AI vendors and tooling),
  systems (compilers, kernels, databases, hardware, OS internals),
  dev (languages, frameworks, libraries, frontend/backend),
  tools (DevOps, CI/CD, cloud, containers, infrastructure),
  general (anything else).
- importance: integer 0-100, an editorial weight independent of the source's popularity. Anchor points: ~90 = major release or actively exploited CVE; ~50 = solid technical deep-dive; ~15 = listicle, repost, or routine patch notes.

Return exactly one result per story, in the same order as the input.`,
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/ai.test.ts`
Expected: PASS, including all pre-existing tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai.ts src/lib/__tests__/ai.test.ts
git commit -m "feat: enrich stories with AI topic, importance, and deeper summaries"
```

---

### Task 5: Radar geometry ranks by blended rank and resolves AI topics

**Files:**
- Modify: `src/lib/radar-geometry.ts`
- Test: `src/lib/__tests__/radar-geometry.test.ts`

**Interfaces:**
- Consumes: `rankStories` (Task 3), `resolveTopic` (Task 2).
- Produces: `plotStories` signature unchanged (`(stories, centerX, centerY, radius) => PlottedStory[]`); internally, sector assignment uses `resolveTopic` and radius/dot size use rank instead of raw within-sector score share.

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/__tests__/radar-geometry.test.ts` (reuse its existing story fixture helper, adding `topic`/`importance` via overrides; if the helper predates Task 1's sweep it already has the fields):

```typescript
describe('plotStories with enriched fields', () => {
  it('places a story in its AI-assigned sector, not the regex sector', () => {
    // Regex would file this under security ("leak"); AI says systems (topicIdx 2).
    const story = makeStory({ title: 'Fixing a memory leak in Go', topic: 'systems' });
    const [plotted] = plotStories([story], 200, 200, 180);
    expect(plotted.topicIdx).toBe(2);
  });

  it('pulls a high-importance no-score story toward the center', () => {
    const important = makeStory({
      id: 'imp', source: 'techmeme', score: null, importance: 95,
    });
    const unranked = makeStory({
      id: 'meh', source: 'techmeme', score: null, importance: null,
    });
    const plotted = plotStories([important, unranked], 200, 200, 180);
    const dist = (p: { x: number; y: number }) =>
      Math.hypot(p.x - 200, p.y - 200);
    const impDot = plotted.find((p) => p.story.id === 'imp')!;
    const mehDot = plotted.find((p) => p.story.id === 'meh')!;
    expect(dist(impDot)).toBeLessThan(dist(mehDot));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/radar-geometry.test.ts`
Expected: the two new tests FAIL (story lands in the regex sector; both no-score dots sit at the same base radius).

- [ ] **Step 3: Implement**

In `src/lib/radar-geometry.ts`:

Update imports:

```typescript
import { TOPICS, resolveTopic } from './topics';
import { rankStories } from './ranking';
```

In `plotStories`, compute ranks once and switch bucketing/sorting:

```typescript
  const ranks = rankStories(stories);

  const byTopic: Record<string, Story[]> = {};
  for (const topic of TOPICS) {
    byTopic[topic.id] = [];
  }
  for (const story of stories) {
    byTopic[resolveTopic(story)].push(story);
  }
  for (const topic of TOPICS) {
    byTopic[topic.id].sort(
      (a, b) => (ranks.get(b.id) ?? 0) - (ranks.get(a.id) ?? 0)
    );
  }
```

Delete the `const maxScore = topicStories[0]?.score ?? 1;` line. In the inner loop, replace the `normalizedScore` computation and its two uses:

```typescript
      // Rank maps to radius: the best-ranked story in a sector sits innermost. The
      // 0.75 factor stops a single top rank from flattening everything else to the rim.
      const rank = ranks.get(story.id) ?? 0;
      const rMin = radius * 0.15;
      const rMax = radius * 0.92;
      const r = rMin + (1 - rank * 0.75) * (rMax - rMin);
```

and

```typescript
      const dotR = critical ? 6 : 3 + rank * 3;
```

If any pre-existing radar test asserted score-based positioning that rank now changes (e.g. relative distances between scored dots), update its fixtures to set `importance: null` so percentile-only ranking reproduces the old ordering — the assertions themselves should keep holding.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/radar-geometry.test.ts`
Expected: PASS, including pre-existing tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/radar-geometry.ts src/lib/__tests__/radar-geometry.test.ts
git commit -m "feat: plot radar dots by blended rank and AI topic"
```

---

### Task 6: Views and API route sort by rank, resolve AI topics

**Files:**
- Modify: `src/app/api/stories/route.ts:24-31`
- Modify: `src/components/templates/tactical-map.tsx:5,67,74`
- Modify: `src/components/organisms/embed-view.tsx:5,20,85,91`
- Modify: `src/lib/topics.ts` (`categorizeStories` bucket sort)
- Test: `src/lib/__tests__/topics.test.ts`

**Interfaces:**
- Consumes: `sortStoriesByRank` (Task 3), `resolveTopic` (Task 2). (`sector-map.tsx` needs no edit — it goes through `categorizeStories`, already switched in Task 2.)
- Produces: user-facing ordering everywhere derives from rank; no new exports.

- [ ] **Step 1: Update the API route**

In `src/app/api/stories/route.ts`, add `import { sortStoriesByRank } from '@/lib/ranking';` and replace the sort block (lines 24–31):

```typescript
    // Rank blends per-source score percentile with AI importance, so score-less
    // RSS sources compete instead of sinking; recency breaks ties inside ranking.
    const sorted = sortStoriesByRank(filtered);
```

- [ ] **Step 2: Update tactical-map**

In `src/components/templates/tactical-map.tsx`:
- Import: change the topics import to `import { TOPICS, categorizeStories, resolveTopic } from '@/lib/topics';` and add `import { sortStoriesByRank } from '@/lib/ranking';`
- Line 67: replace `return [...filtered].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));` with `return sortStoriesByRank(filtered);`
- Line 74: replace `categorizeTopic(story)` with `resolveTopic(story)`.

- [ ] **Step 3: Update embed-view**

In `src/components/organisms/embed-view.tsx`, change the import to `resolveTopic` and replace all three `categorizeTopic(...)` call sites (lines 20, 85, 91) with `resolveTopic(...)`.

- [ ] **Step 4: Sort sector buckets by rank (test first)**

The spec requires map sector story ordering to use rank, but `categorizeStories` in `src/lib/topics.ts` still sorts each bucket by raw score. Append this test to `src/lib/__tests__/topics.test.ts`:

```typescript
  it('sorts stories within a sector by blended rank, not raw score', () => {
    // Both Techmeme (no score); only importance can order them.
    const minor = makeStory({
      id: 'minor', source: 'techmeme', score: null, importance: 10, topic: 'ai',
    });
    const major = makeStory({
      id: 'major', source: 'techmeme', score: null, importance: 90, topic: 'ai',
    });
    const buckets = categorizeStories([minor, major]);
    expect(buckets['ai'].map((s) => s.id)).toEqual(['major', 'minor']);
  });
```

Run `npx vitest run src/lib/__tests__/topics.test.ts` — expected: the new test FAILS (both rank as score 0, insertion order wins).

Then in `src/lib/topics.ts`, add `import { rankStories } from './ranking';` and replace the bucket-sorting loop in `categorizeStories`:

```typescript
  const ranks = rankStories(stories);
  for (const topic of TOPICS) {
    result[topic.id].sort(
      (a, b) => (ranks.get(b.id) ?? 0) - (ranks.get(a.id) ?? 0)
    );
  }
```

Run `npx vitest run src/lib/__tests__/topics.test.ts` — expected: PASS.

- [ ] **Step 5: Full verification**

Run: `npm test && npm run build`
Expected: full suite PASS, production build PASS. Then confirm no orphaned `categorizeTopic` callers remain outside `topics.ts` and its tests:

```bash
grep -rn "categorizeTopic" src --include='*.ts' --include='*.tsx' | grep -v "src/lib/topics.ts" | grep -v "__tests__"
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/stories/route.ts src/components/templates/tactical-map.tsx src/components/organisms/embed-view.tsx src/lib/topics.ts src/lib/__tests__/topics.test.ts
git commit -m "feat: order views and stories API by blended rank"
```
