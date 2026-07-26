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
