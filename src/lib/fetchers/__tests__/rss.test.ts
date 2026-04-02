import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchRssFeed } from '../rss';

const RSS_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>First Article</title>
      <link>https://example.com/first</link>
      <pubDate>Wed, 02 Apr 2026 10:00:00 GMT</pubDate>
      <dc:creator>Alice</dc:creator>
      <description>A short description</description>
      <category>security</category>
      <category>web</category>
    </item>
    <item>
      <title>Second Article</title>
      <link>https://example.com/second</link>
      <pubDate>Wed, 02 Apr 2026 09:00:00 GMT</pubDate>
    </item>
    <item>
      <title></title>
      <link>https://example.com/no-title</link>
    </item>
    <item>
      <title>No Link</title>
      <link></link>
    </item>
  </channel>
</rss>`;

const ATOM_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Feed</title>
  <entry>
    <title>Atom Article</title>
    <link href="https://example.com/atom" />
    <published>2026-04-02T08:00:00Z</published>
    <author><name>Bob</name></author>
  </entry>
</feed>`;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('fetchRssFeed', () => {
  it('parses RSS 2.0 items with all fields', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => RSS_SAMPLE,
    }));

    const stories = await fetchRssFeed({
      sourceId: 'techmeme',
      url: 'https://example.com/feed.xml',
    });

    expect(stories).toHaveLength(2); // skips empty title + empty link
    expect(stories[0].title).toBe('First Article');
    expect(stories[0].url).toBe('https://example.com/first');
    expect(stories[0].source).toBe('techmeme');
    expect(stories[0].author).toBe('Alice');
    expect(stories[0].tags).toEqual(['security', 'web']);
    expect(stories[0].publishedAt).toBe('2026-04-02T10:00:00.000Z');
    expect(stories[0].description).toBe('A short description');

    expect(stories[1].title).toBe('Second Article');
    expect(stories[1].author).toBeNull();
    expect(stories[1].tags).toEqual([]);
  });

  it('parses Atom feeds', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => ATOM_SAMPLE,
    }));

    const stories = await fetchRssFeed({
      sourceId: 'infoq',
      url: 'https://example.com/atom.xml',
    });

    expect(stories).toHaveLength(1);
    expect(stories[0].title).toBe('Atom Article');
    expect(stories[0].url).toBe('https://example.com/atom');
    expect(stories[0].author).toBe('Bob');
    expect(stories[0].publishedAt).toBe('2026-04-02T08:00:00.000Z');
  });

  it('respects limit parameter', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => RSS_SAMPLE,
    }));

    const stories = await fetchRssFeed({
      sourceId: 'techmeme',
      url: 'https://example.com/feed.xml',
      limit: 1,
    });

    expect(stories).toHaveLength(1);
  });

  it('throws on HTTP error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 503,
    }));

    await expect(
      fetchRssFeed({ sourceId: 'techmeme', url: 'https://example.com/feed.xml' })
    ).rejects.toThrow('RSS fetch techmeme: 503');
  });

  it('generates stable IDs from URL', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => RSS_SAMPLE,
    }));

    const stories = await fetchRssFeed({
      sourceId: 'techmeme',
      url: 'https://example.com/feed.xml',
    });

    expect(stories[0].id).toMatch(/^techmeme-/);
    expect(stories[1].id).toMatch(/^techmeme-/);
    expect(stories[0].id).not.toBe(stories[1].id);
  });

  it('sets score to null for RSS sources', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => RSS_SAMPLE,
    }));

    const stories = await fetchRssFeed({
      sourceId: 'infoq',
      url: 'https://example.com/feed.xml',
    });

    expect(stories[0].score).toBeNull();
  });
});
