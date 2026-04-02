import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchLobsters } from '../lobsters';

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

describe('fetchLobsters', () => {
  it('fetches stories and returns Story[]', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse([
        {
          short_id: 'abc123',
          created_at: '2026-04-01T12:00:00Z',
          title: 'Interesting Lobsters Post',
          url: 'https://example.com/post',
          score: 42,
          comment_count: 10,
          description_plain: 'A great post',
          submitter_user: 'lobster1',
          tags: ['programming', 'rust'],
          comments_url: 'https://lobste.rs/s/abc123',
        },
      ])
    );

    const stories = await fetchLobsters();

    expect(stories).toHaveLength(1);
    expect(stories[0].id).toBe('lo-abc123');
    expect(stories[0].source).toBe('lobsters');
    expect(stories[0].title).toBe('Interesting Lobsters Post');
    expect(stories[0].url).toBe('https://example.com/post');
    expect(stories[0].score).toBe(42);
    expect(stories[0].author).toBe('lobster1');
    expect(stories[0].description).toBe('A great post');
    expect(stories[0].tags).toEqual(['programming', 'rust']);
    expect(stories[0].relevant).toBe(true);
    expect(stories[0].summary).toBeNull();
  });

  it('uses comments_url when url is empty', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse([
        {
          short_id: 'def456',
          title: 'Discussion post',
          url: '',
          comments_url: 'https://lobste.rs/s/def456',
          score: 5,
          tags: [],
        },
      ])
    );

    const stories = await fetchLobsters();
    expect(stories[0].url).toBe('https://lobste.rs/s/def456');
  });

  it('skips items without title', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse([
        {
          short_id: 'no-title',
          title: '',
          url: 'https://example.com',
          score: 1,
          tags: [],
        },
      ])
    );

    const stories = await fetchLobsters();
    expect(stories).toHaveLength(0);
  });

  it('skips items without url or comments_url', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse([
        {
          short_id: 'no-url',
          title: 'Has title but no URL',
          url: '',
          comments_url: '',
          score: 1,
          tags: [],
        },
      ])
    );

    const stories = await fetchLobsters();
    expect(stories).toHaveLength(0);
  });

  it('throws on API error', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(null, false, 500));

    await expect(fetchLobsters()).rejects.toThrow('Lobsters API error: 500');
  });

  it('handles missing optional fields', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse([
        {
          short_id: 'minimal',
          title: 'Minimal post',
          url: 'https://example.com',
          score: 0,
        },
      ])
    );

    const stories = await fetchLobsters();
    expect(stories).toHaveLength(1);
    expect(stories[0].author).toBeNull();
    expect(stories[0].description).toBeNull();
    expect(stories[0].tags).toEqual([]);
  });
});
