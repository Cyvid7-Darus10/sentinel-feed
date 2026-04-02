import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchDailyDev } from '../dailydev';

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

function makeGraphQLResponse(nodes: unknown[]) {
  return {
    data: {
      mostUpvotedFeed: {
        edges: nodes.map((node) => ({ node })),
      },
    },
  };
}

describe('fetchDailyDev', () => {
  it('fetches posts and returns Story[]', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(
        makeGraphQLResponse([
          {
            id: 'post-1',
            title: 'Daily Dev Post',
            url: 'https://example.com/post',
            createdAt: '2026-04-01T08:00:00Z',
            numUpvotes: 200,
            numComments: 30,
            source: { name: 'Tech Blog' },
            tags: ['javascript', 'webdev'],
          },
        ])
      )
    );

    const stories = await fetchDailyDev();

    expect(stories).toHaveLength(1);
    expect(stories[0].id).toBe('dd-post-1');
    expect(stories[0].source).toBe('dailydev');
    expect(stories[0].title).toBe('Daily Dev Post');
    expect(stories[0].url).toBe('https://example.com/post');
    expect(stories[0].score).toBe(200);
    expect(stories[0].author).toBe('Tech Blog');
    expect(stories[0].tags).toEqual(['javascript', 'webdev']);
    expect(stories[0].relevant).toBe(true);
    expect(stories[0].summary).toBeNull();
    expect(stories[0].publishedAt).toBe('2026-04-01T08:00:00Z');
  });

  it('throws on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(null, false, 503));

    await expect(fetchDailyDev()).rejects.toThrow('daily.dev API error: 503');
  });

  it('throws on GraphQL errors', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        errors: [{ message: 'Rate limited' }],
      })
    );

    await expect(fetchDailyDev()).rejects.toThrow('daily.dev GraphQL: Rate limited');
  });

  it('skips posts without title', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(
        makeGraphQLResponse([
          {
            id: 'no-title',
            title: '',
            url: 'https://example.com',
            numUpvotes: 5,
            tags: [],
          },
        ])
      )
    );

    const stories = await fetchDailyDev();
    expect(stories).toHaveLength(0);
  });

  it('skips posts without url', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(
        makeGraphQLResponse([
          {
            id: 'no-url',
            title: 'Has title',
            url: '',
            numUpvotes: 5,
            tags: [],
          },
        ])
      )
    );

    const stories = await fetchDailyDev();
    expect(stories).toHaveLength(0);
  });

  it('handles missing optional fields', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(
        makeGraphQLResponse([
          {
            id: 'minimal',
            title: 'Minimal Post',
            url: 'https://example.com',
            numUpvotes: 0,
            source: null,
          },
        ])
      )
    );

    const stories = await fetchDailyDev();
    expect(stories).toHaveLength(1);
    expect(stories[0].author).toBeNull();
    expect(stories[0].tags).toEqual([]);
    expect(stories[0].publishedAt).toBeNull();
  });

  it('handles empty feed response', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ data: {} }));

    const stories = await fetchDailyDev();
    expect(stories).toHaveLength(0);
  });

  it('sends POST request with GraphQL query', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(makeGraphQLResponse([])));

    await fetchDailyDev();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.daily.dev/graphql',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: expect.stringContaining('mostUpvotedFeed'),
      })
    );
  });
});
