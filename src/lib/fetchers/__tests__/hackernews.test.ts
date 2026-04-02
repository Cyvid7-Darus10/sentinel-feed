import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchHackerNews } from '../hackernews';

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
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

describe('fetchHackerNews', () => {
  it('fetches top stories and returns Story[]', async () => {
    // Mock topstories response
    mockFetch.mockResolvedValueOnce(mockResponse([101, 102]));

    // Mock individual item responses
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        id: 101,
        type: 'story',
        by: 'user1',
        time: 1711929600, // 2024-04-01T00:00:00Z
        title: 'Show HN: A cool project',
        url: 'https://example.com/cool',
        score: 150,
      })
    );
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        id: 102,
        type: 'story',
        by: 'user2',
        time: 1711929600,
        title: 'Another story',
        url: 'https://example.com/another',
        score: 75,
      })
    );

    const stories = await fetchHackerNews();

    expect(stories).toHaveLength(2);
    expect(stories[0].id).toBe('hn-101');
    expect(stories[0].source).toBe('hackernews');
    expect(stories[0].title).toBe('Show HN: A cool project');
    expect(stories[0].url).toBe('https://example.com/cool');
    expect(stories[0].score).toBe(150);
    expect(stories[0].author).toBe('user1');
    expect(stories[0].relevant).toBe(true);
    expect(stories[0].summary).toBeNull();
  });

  it('skips items without title', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([101]));
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        id: 101,
        type: 'comment',
        by: 'user1',
        url: 'https://example.com',
        // No title
      })
    );

    const stories = await fetchHackerNews();
    expect(stories).toHaveLength(0);
  });

  it('skips items without url (Ask HN, polls)', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([101]));
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        id: 101,
        type: 'story',
        title: 'Ask HN: Something',
        // No url
      })
    );

    const stories = await fetchHackerNews();
    expect(stories).toHaveLength(0);
  });

  it('throws on API error', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(null, false, 503));

    await expect(fetchHackerNews()).rejects.toThrow('HN API error: 503');
  });

  it('handles failed individual item fetches gracefully', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([101, 102]));

    // First item succeeds
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        id: 101,
        type: 'story',
        title: 'Good story',
        url: 'https://example.com',
        score: 50,
      })
    );

    // Second item fails
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const stories = await fetchHackerNews();
    expect(stories).toHaveLength(1);
    expect(stories[0].title).toBe('Good story');
  });

  it('limits to 30 stories', async () => {
    const ids = Array.from({ length: 50 }, (_, i) => i + 1);
    mockFetch.mockResolvedValueOnce(mockResponse(ids));

    // Mock 30 item responses
    for (let i = 1; i <= 30; i++) {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          id: i,
          type: 'story',
          title: `Story ${i}`,
          url: `https://example.com/${i}`,
          score: i,
        })
      );
    }

    const stories = await fetchHackerNews();
    expect(stories).toHaveLength(30);
    // First call is topstories, then 30 item fetches
    expect(mockFetch.mock.calls[0][0]).toContain('topstories.json');
  });

  it('sets publishedAt from Unix timestamp', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([101]));
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        id: 101,
        type: 'story',
        time: 1711929600,
        title: 'Test',
        url: 'https://example.com',
      })
    );

    const stories = await fetchHackerNews();
    expect(stories[0].publishedAt).toBe(
      new Date(1711929600 * 1000).toISOString()
    );
  });

  it('sets publishedAt to null when time is missing', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([101]));
    mockFetch.mockResolvedValueOnce(
      mockResponse({
        id: 101,
        type: 'story',
        title: 'Test',
        url: 'https://example.com',
      })
    );

    const stories = await fetchHackerNews();
    expect(stories[0].publishedAt).toBeNull();
  });
});
