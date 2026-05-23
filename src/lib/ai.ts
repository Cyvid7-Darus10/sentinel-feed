import { generateText, Output } from 'ai';
import { z } from 'zod';
import type { Story } from './types';

const MODEL = 'anthropic/claude-haiku-4.5';
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

  // Cap batch size to control costs
  const toEnrich = stories.slice(0, MAX_BATCH_SIZE);
  const skipped = stories.slice(MAX_BATCH_SIZE);

  try {
    const results = await batchAnalyze(toEnrich);
    const enriched = toEnrich.map((story, i) => ({
      ...story,
      relevant: results[i]?.relevant ?? true,
      summary: normalizeSummary(results[i]?.summary),
    }));
    return [...enriched, ...skipped];
  } catch {
    // If AI fails, return stories without summaries — still useful
    return [...stories];
  }
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
