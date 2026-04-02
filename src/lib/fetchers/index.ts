import type { FetchResult, Story } from '../types';
import { normalizeUrl } from '../utils';
import { fetchHackerNews } from './hackernews';
import { fetchGithubTrending } from './github-trending';
import { fetchLobsters } from './lobsters';
import { fetchDevto } from './devto';
import { fetchReddit } from './reddit';

export async function fetchAllSources(
  existingUrls: ReadonlySet<string>
): Promise<readonly FetchResult[]> {
  const fetchers = [
    { source: 'hackernews' as const, fn: fetchHackerNews },
    { source: 'github-trending' as const, fn: fetchGithubTrending },
    { source: 'lobsters' as const, fn: fetchLobsters },
    { source: 'devto' as const, fn: fetchDevto },
    { source: 'reddit' as const, fn: fetchReddit },
  ];

  const results = await Promise.allSettled(
    fetchers.map(async ({ source, fn }): Promise<FetchResult> => {
      try {
        const raw = await fn();
        const deduped = raw.filter(
          (s) => !existingUrls.has(normalizeUrl(s.url))
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
