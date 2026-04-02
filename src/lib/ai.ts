import { generateText } from 'ai';
import type { Story } from './types';

const MODEL = 'anthropic/claude-haiku-4.5';
const MAX_BATCH_SIZE = 50;

interface AiResult {
  readonly relevant: boolean;
  readonly summary: string | null;
}

export async function enrichStories(
  stories: readonly Story[]
): Promise<Story[]> {
  if (stories.length === 0) return [];

  // Skip AI if explicitly disabled
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
      summary: results[i]?.summary ?? null,
    }));
    // Stories beyond the cap pass through without AI — still saved
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
    .map((s, i) => `${i + 1}. "${s.title}"${s.description ? ` — ${s.description.slice(0, 120)}` : ''}`)
    .join('\n');

  const { text } = await generateText({
    model: MODEL,
    system: `You are a tech news relevance filter for software engineers. For each story title, determine:
1. Is it relevant to software engineering, programming, AI/ML, DevOps, or tech industry? (true/false)
2. A one-line summary of why it matters to developers (max 100 chars, or null if not relevant).

Respond ONLY with a JSON array of objects: [{"relevant": true, "summary": "..."}, ...]
No markdown, no explanation. Array length must match input count.`,
    prompt: `Analyze these ${stories.length} stories:\n${numbered}`,
    temperature: 0,
  });

  return parseAiResponse(text, stories.length);
}

function parseAiResponse(text: string, expectedCount: number): AiResult[] {
  // Extract JSON array from response (handle potential markdown wrapping)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return Array.from({ length: expectedCount }, () => ({
      relevant: true,
      summary: null,
    }));
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as AiResult[];
    if (!Array.isArray(parsed) || parsed.length !== expectedCount) {
      return Array.from({ length: expectedCount }, () => ({
        relevant: true,
        summary: null,
      }));
    }
    return parsed.map((r) => ({
      relevant: typeof r.relevant === 'boolean' ? r.relevant : true,
      summary: typeof r.summary === 'string' ? r.summary.slice(0, 120) : null,
    }));
  } catch {
    return Array.from({ length: expectedCount }, () => ({
      relevant: true,
      summary: null,
    }));
  }
}
