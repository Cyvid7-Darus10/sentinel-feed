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
  // Stored blobs are read back without re-validation, so importance may be
  // undefined (pre-upgrade blobs), NaN/Infinity, or outside 0-100. Anything
  // that isn't a finite number in range is treated as absent; anything else
  // is clamped rather than trusted as-is.
  const imp =
    typeof importance === 'number' && Number.isFinite(importance)
      ? Math.min(100, Math.max(0, importance))
      : null;

  const rank =
    percentile !== undefined && imp !== null
      ? 0.5 * percentile + 0.5 * (imp / 100)
      : percentile !== undefined
        ? percentile
        : imp !== null
          ? imp / 100
          : 0;

  return Math.min(1, Math.max(0, rank));
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
      const score = story.score ?? 0;
      const below = scores.filter((v) => v < score).length;
      const ties = scores.filter((v) => v === score).length;
      // Midrank: tied scores share the middle of their band instead of all
      // sinking to the bottom of it (an all-tied group would otherwise
      // collapse every story to percentile 0).
      percentiles.set(
        story.id,
        group.length > 1 ? (below + 0.5 * (ties - 1)) / (group.length - 1) : 1
      );
    }
  }
  return percentiles;
}
