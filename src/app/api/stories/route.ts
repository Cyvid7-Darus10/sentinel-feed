import { NextRequest, NextResponse } from 'next/server';
import { readStoriesForDays } from '@/lib/storage';
import type { SourceId } from '@/lib/types';
import { VALID_SOURCE_SET } from '@/lib/sources';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const rawSource = searchParams.get('source');
  const source: SourceId | null =
    rawSource && VALID_SOURCE_SET.has(rawSource) ? (rawSource as SourceId) : null;

  const rawDays = parseInt(searchParams.get('days') ?? '1', 10);
  const days = Number.isNaN(rawDays) ? 1 : Math.min(Math.max(rawDays, 1), 7);

  const stories = await readStoriesForDays(days);

  const filtered = source
    ? stories.filter((s) => s.source === source)
    : stories;

  // Sort by score descending, then by fetchedAt descending
  const sorted = [...filtered].sort((a, b) => {
    const scoreA = a.score ?? 0;
    const scoreB = b.score ?? 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime();
  });

  return NextResponse.json({ stories: sorted, count: sorted.length });
}
