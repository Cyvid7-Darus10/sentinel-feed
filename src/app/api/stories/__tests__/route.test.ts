import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { Story } from '@/lib/types';

vi.mock('@/lib/storage', () => ({
  readStoriesForDays: vi.fn(),
}));

import { GET } from '../route';
import { readStoriesForDays } from '@/lib/storage';

const mockRead = vi.mocked(readStoriesForDays);

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

function request(query = ''): NextRequest {
  return new NextRequest(`http://localhost/api/stories${query}`);
}

describe('GET /api/stories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRead.mockResolvedValue([]);
  });

  describe('days clamping', () => {
    it('defaults to 1 day when no param is given', async () => {
      await GET(request());
      expect(mockRead).toHaveBeenCalledWith(1);
    });

    it('clamps days above 7 down to 7', async () => {
      await GET(request('?days=100'));
      expect(mockRead).toHaveBeenCalledWith(7);
    });

    it('clamps days below 1 up to 1', async () => {
      await GET(request('?days=0'));
      expect(mockRead).toHaveBeenCalledWith(1);
    });

    it('falls back to 1 for a non-numeric days param', async () => {
      await GET(request('?days=abc'));
      expect(mockRead).toHaveBeenCalledWith(1);
    });
  });

  describe('source validation', () => {
    it('filters to a valid source', async () => {
      mockRead.mockResolvedValue([
        makeStory({ id: 'a', source: 'hackernews' }),
        makeStory({ id: 'b', source: 'lobsters' }),
      ]);

      const res = await GET(request('?source=hackernews'));
      const body = await res.json();

      expect(body.count).toBe(1);
      expect(body.stories[0].source).toBe('hackernews');
    });

    it('ignores an unknown source and returns everything', async () => {
      mockRead.mockResolvedValue([
        makeStory({ id: 'a', source: 'hackernews' }),
        makeStory({ id: 'b', source: 'lobsters' }),
      ]);

      const res = await GET(request('?source=not-a-real-source'));
      const body = await res.json();

      expect(body.count).toBe(2);
    });
  });

  describe('sorting', () => {
    it('sorts by score desc, then fetchedAt desc', async () => {
      mockRead.mockResolvedValue([
        makeStory({ id: 'low', score: 5, fetchedAt: '2026-04-01T10:00:00Z' }),
        makeStory({ id: 'high', score: 50, fetchedAt: '2026-04-01T09:00:00Z' }),
        makeStory({ id: 'mid-late', score: 50, fetchedAt: '2026-04-01T11:00:00Z' }),
      ]);

      const res = await GET(request());
      const body = await res.json();

      // Two with score 50 come first, newest fetchedAt wins the tie.
      expect(body.stories.map((s: Story) => s.id)).toEqual([
        'mid-late',
        'high',
        'low',
      ]);
    });

    it('treats a null score as 0 when sorting', async () => {
      mockRead.mockResolvedValue([
        makeStory({ id: 'null-score', score: null }),
        makeStory({ id: 'scored', score: 1 }),
      ]);

      const res = await GET(request());
      const body = await res.json();

      expect(body.stories[0].id).toBe('scored');
    });
  });

  describe('response headers', () => {
    it('sets CORS and cache-control headers', async () => {
      const res = await GET(request());
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(res.headers.get('Cache-Control')).toContain('s-maxage=60');
    });
  });

  describe('error handling', () => {
    it('returns a 500 JSON envelope when the storage read throws', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mockRead.mockRejectedValueOnce(new Error('blob unavailable'));

      const res = await GET(request());

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: 'Internal server error' });
    });
  });
});
