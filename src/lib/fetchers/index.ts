import type { FetchResult, Story } from '../types';
import { normalizeUrl, isSafeUrl } from '../utils';
import { fetchHackerNews } from './hackernews';
import { fetchGithubTrending } from './github-trending';
import { fetchLobsters } from './lobsters';
import { fetchDevto } from './devto';
import { fetchDailyDev } from './dailydev';
import { fetchTechmeme } from './techmeme';
import { fetchInfoQ } from './infoq';

export async function fetchAllSources(
  existingUrls: ReadonlySet<string>
): Promise<readonly FetchResult[]> {
  const fetchers = [
    { source: 'hackernews' as const, fn: fetchHackerNews },
    { source: 'github-trending' as const, fn: fetchGithubTrending },
    { source: 'lobsters' as const, fn: fetchLobsters },
    { source: 'devto' as const, fn: fetchDevto },
    { source: 'dailydev' as const, fn: fetchDailyDev },
    { source: 'techmeme' as const, fn: fetchTechmeme },
    { source: 'infoq' as const, fn: fetchInfoQ },
  ];

  const results = await Promise.allSettled(
    fetchers.map(async ({ source, fn }): Promise<FetchResult> => {
      try {
        const raw = await fn();
        // Reject non-http(s) links (e.g. javascript:/data:) at the ingestion
        // boundary, so an unsafe URL from a poisoned feed never reaches the
        // public blob store or the API, regardless of render-side guards.
        const deduped = raw.filter(
          (s) => isSafeUrl(s.url) && !existingUrls.has(normalizeUrl(s.url))
        );
        return { source, stories: deduped, error: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return { source, stories: [], error: message };
      }
    })
  );

  return results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { source: fetchers[i].source, stories: [], error: 'Fetch failed' }
  );
}

export function buildExistingUrlSet(stories: readonly Story[]): Set<string> {
  return new Set(stories.map((s) => normalizeUrl(s.url)));
}

/**
 * Drop stories that share a normalized URL with an earlier story. Each source
 * is deduped against already-stored URLs, but two sources can still surface the
 * same link in one run; this collapses those to the first occurrence.
 */
export function dedupeStoriesByUrl(stories: readonly Story[]): Story[] {
  const seen = new Set<string>();
  const unique: Story[] = [];
  for (const story of stories) {
    const key = normalizeUrl(story.url);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(story);
  }
  return unique;
}
