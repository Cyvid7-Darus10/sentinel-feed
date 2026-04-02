import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchDevto } from '../devto';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function mockResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
  };
}

describe('fetchDevto', () => {
  it('fetches articles and returns Story[]', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse([
        {
          id: 12345,
          title: 'How to Build APIs',
          description: 'A guide to building REST APIs',
          url: 'https://dev.to/user/how-to-build-apis',
          published_at: '2026-04-01T10:00:00Z',
          reading_time_minutes: 5,
          tag_list: ['api', 'rest', 'node'],
          public_reactions_count: 100,
          comments_count: 12,
          user: { name: 'Dev User', username: 'devuser' },
        },
      ])
    );

    const stories = await fetchDevto();

    expect(stories).toHaveLength(1);
    expect(stories[0].id).toBe('dev-12345');
    expect(stories[0].source).toBe('devto');
    expect(stories[0].title).toBe('How to Build APIs');
    expect(stories[0].url).toBe('https://dev.to/user/how-to-build-apis');
    expect(stories[0].score).toBe(100);
    expect(stories[0].author).toBe('devuser');
    expect(stories[0].description).toBe('A guide to building REST APIs');
    expect(stories[0].tags).toEqual(['api', 'rest', 'node']);
    expect(stories[0].relevant).toBe(true);
    expect(stories[0].summary).toBeNull();
    expect(stories[0].publishedAt).toBe('2026-04-01T10:00:00Z');
  });

  it('skips articles without title', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse([
        {
          id: 1,
          title: '',
          url: 'https://dev.to/a',
          public_reactions_count: 0,
          user: { name: 'A', username: 'a' },
          tag_list: [],
        },
      ])
    );

    const stories = await fetchDevto();
    expect(stories).toHaveLength(0);
  });

  it('skips articles without url', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse([
        {
          id: 2,
          title: 'Has title',
          url: '',
          public_reactions_count: 0,
          user: { name: 'A', username: 'a' },
          tag_list: [],
        },
      ])
    );

    const stories = await fetchDevto();
    expect(stories).toHaveLength(0);
  });

  it('throws on API error', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(null, false, 429));

    await expect(fetchDevto()).rejects.toThrow('Dev.to API error: 429');
  });

  it('handles missing optional fields', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse([
        {
          id: 99,
          title: 'Minimal article',
          url: 'https://dev.to/x',
          public_reactions_count: 5,
          user: {},
          description: '',
        },
      ])
    );

    const stories = await fetchDevto();
    expect(stories).toHaveLength(1);
    expect(stories[0].author).toBeNull();
    expect(stories[0].description).toBeNull();
    expect(stories[0].tags).toEqual([]);
    expect(stories[0].publishedAt).toBeNull();
  });
});
