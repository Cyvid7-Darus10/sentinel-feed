import { NextRequest, NextResponse } from 'next/server';
import { fetchAllSources, buildExistingUrlSet } from '@/lib/fetchers';
import { enrichStories } from '@/lib/ai';
import {
  readTodayStories,
  writeTodayStories,
  readSourceHealth,
  writeSourceHealth,
} from '@/lib/storage';
import type { SourceHealth, Story } from '@/lib/types';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const existing = await readTodayStories();
    const existingUrls = buildExistingUrlSet(existing);

    const results = await fetchAllSources(existingUrls);

    const allNew: Story[] = [];
    for (const result of results) {
      allNew.push(...result.stories);
    }

    const enriched = await enrichStories(allNew);
    const relevant = enriched.filter((s) => s.relevant);

    const merged = [...existing, ...relevant];
    await writeTodayStories(merged);

    const health = await readSourceHealth();
    const updatedSources = { ...health.sources };

    for (const result of results) {
      const sourceStories = relevant.filter((s) => s.source === result.source);
      updatedSources[result.source] = {
        name: sourceDisplayName(result.source),
        lastFetchAt: new Date().toISOString(),
        lastFetchCount: sourceStories.length,
        status: result.error ? 'error' : 'healthy',
        errorMessage: result.error,
        totalStoriesToday:
          (health.sources[result.source]?.totalStoriesToday ?? 0) +
          sourceStories.length,
      };
    }

    const updatedHealth: SourceHealth = {
      sources: updatedSources,
      updatedAt: new Date().toISOString(),
    };
    await writeSourceHealth(updatedHealth);

    return NextResponse.json({
      fetched: allNew.length,
      relevant: relevant.length,
      total: merged.length,
      sources: Object.fromEntries(
        results.map((r) => [r.source, { count: r.stories.length, error: r.error }])
      ),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[fetch] Pipeline failed:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function sourceDisplayName(source: string): string {
  const names: Record<string, string> = {
    hackernews: 'Hacker News',
    'github-trending': 'GitHub Trending',
  };
  return names[source] ?? source;
}
