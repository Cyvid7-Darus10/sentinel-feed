import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SourceHealth } from '@/lib/types';

vi.mock('@/lib/storage', () => ({
  readSourceHealth: vi.fn(),
}));

import { GET } from '../route';
import { readSourceHealth } from '@/lib/storage';

const mockRead = vi.mocked(readSourceHealth);

describe('GET /api/sources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the stored source health', async () => {
    const health: SourceHealth = {
      sources: {
        hackernews: {
          name: 'Hacker News',
          lastFetchAt: '2026-04-01T12:00:00Z',
          lastFetchCount: 5,
          status: 'healthy',
          errorMessage: null,
          totalStoriesToday: 12,
        },
      },
      updatedAt: '2026-04-01T12:00:00Z',
    };
    mockRead.mockResolvedValueOnce(health);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.sources.hackernews.name).toBe('Hacker News');
  });

  it('sets CDN cache and CORS headers so polling hits the edge', async () => {
    mockRead.mockResolvedValueOnce({ sources: {}, updatedAt: '2026-04-01T12:00:00Z' });

    const res = await GET();

    expect(res.headers.get('Cache-Control')).toContain('s-maxage=60');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('returns a 500 envelope with empty sources when the read throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockRead.mockRejectedValueOnce(new Error('blob error'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.sources).toEqual({});
    expect(typeof body.updatedAt).toBe('string');
  });
});
