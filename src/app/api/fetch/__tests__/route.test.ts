import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { Story, SourceHealth, FetchResult } from '@/lib/types';

vi.mock('@/lib/fetchers', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/fetchers')>('@/lib/fetchers');
  return {
    fetchAllSources: vi.fn(),
    buildExistingUrlSet: vi.fn(() => new Set<string>()),
    // Use the real dedup so the route's cross-source behavior is exercised.
    dedupeStoriesByUrl: actual.dedupeStoriesByUrl,
  };
});
vi.mock('@/lib/ai', () => ({
  enrichStories: vi.fn(),
}));
vi.mock('@/lib/storage', () => ({
  readTodayStories: vi.fn(),
  writeTodayStories: vi.fn(),
  readSourceHealth: vi.fn(),
  writeSourceHealth: vi.fn(),
}));

import { GET } from '../route';
import { fetchAllSources } from '@/lib/fetchers';
import { enrichStories } from '@/lib/ai';
import {
  readTodayStories,
  writeTodayStories,
  readSourceHealth,
  writeSourceHealth,
} from '@/lib/storage';

const mockFetchAll = vi.mocked(fetchAllSources);
const mockEnrich = vi.mocked(enrichStories);
const mockReadToday = vi.mocked(readTodayStories);
const mockWriteToday = vi.mocked(writeTodayStories);
const mockReadHealth = vi.mocked(readSourceHealth);
const mockWriteHealth = vi.mocked(writeSourceHealth);

const ORIGINAL_SECRET = process.env.CRON_SECRET;

function makeStory(overrides: Partial<Story> = {}): Story {
  return {
    id: 'hn-1',
    source: 'hackernews',
    title: 'Story',
    url: 'https://example.com',
    score: 10,
    author: null,
    description: null,
    tags: [],
    summary: null,
    relevant: true,
    fetchedAt: '2026-04-01T12:00:00Z',
    publishedAt: null,
    topic: null,
    importance: null,
    ...overrides,
  };
}

function request(authHeader?: string): NextRequest {
  return new NextRequest('http://localhost/api/fetch', {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

const emptyHealth: SourceHealth = { sources: {}, updatedAt: '2026-04-01T00:00:00Z' };

describe('GET /api/fetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    process.env.CRON_SECRET = 'top-secret';
  });

  afterEach(() => {
    if (ORIGINAL_SECRET === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = ORIGINAL_SECRET;
    }
  });

  it('rejects unauthorized requests before running the pipeline', async () => {
    const res = await GET(request('Bearer wrong'));

    expect(res.status).toBe(401);
    expect(mockFetchAll).not.toHaveBeenCalled();
    expect(mockWriteToday).not.toHaveBeenCalled();
  });

  it('fetches, enriches, merges, and persists when authorized', async () => {
    const fresh = makeStory({ id: 'hn-2', url: 'https://example.com/new' });
    const fetchResults: FetchResult[] = [
      { source: 'hackernews', stories: [fresh], error: null },
    ];

    mockReadToday.mockResolvedValueOnce([]);
    mockFetchAll.mockResolvedValueOnce(fetchResults);
    mockEnrich.mockResolvedValueOnce([{ ...fresh, relevant: true, summary: 'why' }]);
    mockReadHealth.mockResolvedValueOnce(emptyHealth);

    const res = await GET(request('Bearer top-secret'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.fetched).toBe(1);
    expect(body.relevant).toBe(1);
    expect(body.total).toBe(1);
    expect(body.sources.hackernews.count).toBe(1);

    // Merged stories are persisted, and source health is updated to healthy.
    expect(mockWriteToday).toHaveBeenCalledTimes(1);
    const written = mockWriteToday.mock.calls[0][0] as Story[];
    expect(written).toHaveLength(1);

    const health = mockWriteHealth.mock.calls[0][0] as SourceHealth;
    expect(health.sources.hackernews.status).toBe('healthy');
    expect(health.sources.hackernews.lastFetchCount).toBe(1);
  });

  it('drops AI-irrelevant stories from the persisted set', async () => {
    const a = makeStory({ id: 'hn-a', url: 'https://example.com/a' });
    const b = makeStory({ id: 'hn-b', url: 'https://example.com/b' });

    mockReadToday.mockResolvedValueOnce([]);
    mockFetchAll.mockResolvedValueOnce([
      { source: 'hackernews', stories: [a, b], error: null },
    ]);
    mockEnrich.mockResolvedValueOnce([
      { ...a, relevant: true },
      { ...b, relevant: false },
    ]);
    mockReadHealth.mockResolvedValueOnce(emptyHealth);

    const res = await GET(request('Bearer top-secret'));
    const body = await res.json();

    expect(body.fetched).toBe(2);
    expect(body.relevant).toBe(1);
    const written = mockWriteToday.mock.calls[0][0] as Story[];
    expect(written.map((s) => s.id)).toEqual(['hn-a']);
  });

  it('collapses the same URL surfaced by two sources before persisting', async () => {
    const hn = makeStory({ id: 'hn-x', source: 'hackernews', url: 'https://example.com/dup' });
    const lo = makeStory({ id: 'lo-x', source: 'lobsters', url: 'https://example.com/dup/' });

    mockReadToday.mockResolvedValueOnce([]);
    mockFetchAll.mockResolvedValueOnce([
      { source: 'hackernews', stories: [hn], error: null },
      { source: 'lobsters', stories: [lo], error: null },
    ]);
    // enrichStories receives the already-deduped list; echo it back as relevant.
    mockEnrich.mockImplementationOnce(async (stories) =>
      stories.map((s) => ({ ...s, relevant: true }))
    );
    mockReadHealth.mockResolvedValueOnce(emptyHealth);

    const res = await GET(request('Bearer top-secret'));
    const body = await res.json();

    expect(body.fetched).toBe(1); // two raw stories collapsed to one
    const written = mockWriteToday.mock.calls[0][0] as Story[];
    expect(written).toHaveLength(1);
    expect(written[0].id).toBe('hn-x'); // first occurrence wins
  });

  it('returns 500 when the pipeline throws', async () => {
    mockReadToday.mockRejectedValueOnce(new Error('blob down'));

    const res = await GET(request('Bearer top-secret'));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Internal server error' });
  });
});
