import { NextRequest, NextResponse } from 'next/server';
import { readStoriesForDays } from '@/lib/storage';
import type { SourceId } from '@/lib/types';
import { VALID_SOURCE_SET } from '@/lib/sources';
import { PUBLIC_GET_HEADERS, hasOnlyAllowedParams } from '@/lib/config';
import { sortStoriesByRank } from '@/lib/ranking';

const ALLOWED_PARAMS = ['days', 'source'] as const;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  if (!hasOnlyAllowedParams(searchParams, ALLOWED_PARAMS)) {
    return NextResponse.json(
      { error: 'Unsupported query parameter' },
      { status: 400, headers: PUBLIC_GET_HEADERS }
    );
  }

  const rawSource = searchParams.get('source');
  const source: SourceId | null =
    rawSource && VALID_SOURCE_SET.has(rawSource) ? (rawSource as SourceId) : null;

  const rawDays = parseInt(searchParams.get('days') ?? '1', 10);
  const days = Number.isNaN(rawDays) ? 1 : Math.min(Math.max(rawDays, 1), 7);

  try {
    const stories = await readStoriesForDays(days);

    const filtered = source
      ? stories.filter((s) => s.source === source)
      : stories;

    // Rank blends per-source score percentile with AI importance, so score-less
    // RSS sources compete instead of sinking; recency breaks ties inside ranking.
    const sorted = sortStoriesByRank(filtered);

    return NextResponse.json(
      { stories: sorted, count: sorted.length },
      { headers: PUBLIC_GET_HEADERS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[stories] Failed:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
