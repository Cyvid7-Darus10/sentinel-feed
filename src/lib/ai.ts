import { generateText, Output } from 'ai';
import { z } from 'zod';
import type { Story } from './types';

const MODEL = 'anthropic/claude-haiku-4.5';
// Stories are analyzed in batches of this size to keep each prompt small and
// reliable. All stories are processed — batches run concurrently.
const MAX_BATCH_SIZE = 50;
const MAX_SUMMARY_LENGTH = 120;
const DESCRIPTION_PREVIEW_LENGTH = 120;

const aiResultSchema = z.object({
  relevant: z.boolean(),
  summary: z.string().nullable(),
});

type AiResult = z.infer<typeof aiResultSchema>;

export async function enrichStories(
  stories: readonly Story[]
): Promise<Story[]> {
  if (stories.length === 0) return [];

  if (process.env.ENABLE_AI_ENRICHMENT === 'false') {
    return [...stories];
  }

  // Process every story — split into batches so each prompt stays small, and
  // run them concurrently. A failing batch falls back to its stories untouched
  // rather than discarding the whole run.
  const batches = chunk(stories, MAX_BATCH_SIZE);
  const enrichedBatches = await Promise.all(batches.map(enrichBatch));
  return enrichedBatches.flat();
}

async function enrichBatch(stories: readonly Story[]): Promise<Story[]> {
  try {
    const results = await batchAnalyze(stories);
    return stories.map((story, i) => ({
      ...story,
      relevant: results[i]?.relevant ?? true,
      summary: normalizeSummary(results[i]?.summary),
    }));
  } catch (err) {
    // If AI fails for this batch, keep its stories without summaries — still
    // useful. Log it: these stories pass through unfiltered (relevant: true),
    // so silent failures would quietly inflate the feed.
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `[ai] Batch of ${stories.length} failed enrichment; passing through unfiltered: ${message}`
    );
    return [...stories];
  }
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

async function batchAnalyze(
  stories: readonly Story[]
): Promise<AiResult[]> {
  const numbered = stories
    .map(
      (s, i) =>
        `${i + 1}. "${s.title}"${
          s.description
            ? ` — ${s.description.slice(0, DESCRIPTION_PREVIEW_LENGTH)}`
            : ''
        }`
    )
    .join('\n');

  // Output.array validates structured output; malformed responses throw (caught by caller).
  const { output } = await generateText({
    model: MODEL,
    output: Output.array({ element: aiResultSchema }),
    system: `You are a tech news relevance filter for software engineers. For each story, decide:
- relevant: true if it relates to software engineering, programming, AI/ML, DevOps, or the tech industry; false otherwise.
- summary: a one-line reason it matters to developers (max ${MAX_SUMMARY_LENGTH} chars), or null when not relevant.

Return exactly one result per story, in the same order as the input.`,
    prompt: `Analyze these ${stories.length} stories:\n${numbered}`,
    temperature: 0,
  });

  // Trust only a 1:1 mapping; otherwise keep everything.
  if (output.length !== stories.length) {
    console.warn(
      `[ai] Expected ${stories.length} results, got ${output.length}; using neutral defaults`
    );
    return stories.map(() => ({ relevant: true, summary: null }));
  }

  return output;
}

function normalizeSummary(summary: string | null | undefined): string | null {
  if (typeof summary !== 'string') return null;
  return summary.slice(0, MAX_SUMMARY_LENGTH);
}
