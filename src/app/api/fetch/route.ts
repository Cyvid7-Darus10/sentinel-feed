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
import { getSourceDisplayName } from '@/lib/sources';
import { verifyCronAuth } from '@/lib/cron-auth';

// Allow up to 60s for fetching all sources + AI enrichment
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  console.log('[fetch] Cron invoked at', new Date().toISOString());

  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    console.log('[fetch] Auth passed, starting pipeline');
    const existing = await readTodayStories();
    const existingUrls = buildExistingUrlSet(existing);
    console.log('[fetch] Existing stories:', existing.length);

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
        name: getSourceDisplayName(result.source),
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

    const response = {
      fetched: allNew.length,
      relevant: relevant.length,
      total: merged.length,
      sources: Object.fromEntries(
        results.map((r) => [r.source, { count: r.stories.length, error: r.error }])
      ),
    };

    console.log('[fetch] Done:', JSON.stringify(response));
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    const stack = err instanceof Error ? err.stack : undefined;
    console.error('[fetch] Pipeline failed:', message, stack);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

