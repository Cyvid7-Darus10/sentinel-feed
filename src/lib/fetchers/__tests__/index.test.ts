import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Story } from '../../types';

vi.mock('../hackernews', () => ({
  fetchHackerNews: vi.fn(),
}));

vi.mock('../github-trending', () => ({
  fetchGithubTrending: vi.fn(),
}));

vi.mock('../lobsters', () => ({
  fetchLobsters: vi.fn(),
}));

vi.mock('../devto', () => ({
  fetchDevto: vi.fn(),
}));

vi.mock('../reddit', () => ({
  fetchReddit: vi.fn(),
}));

import { fetchAllSources, buildExistingUrlSet } from '../index';
import { fetchHackerNews } from '../hackernews';
import { fetchGithubTrending } from '../github-trending';
import { fetchLobsters } from '../lobsters';
import { fetchDevto } from '../devto';
import { fetchReddit } from '../reddit';

const mockFetchHN = vi.mocked(fetchHackerNews);
const mockFetchGH = vi.mocked(fetchGithubTrending);
const mockFetchLO = vi.mocked(fetchLobsters);
const mockFetchDev = vi.mocked(fetchDevto);
const mockFetchRD = vi.mocked(fetchReddit);

function makeStory(overrides: Partial<Story>): Story {
  return {
    id: 'test-1',
    source: 'hackernews',
    title: 'Test',
    url: 'https://example.com',
    score: 100,
    author: null,
    description: null,
    tags: [],
    summary: null,
    relevant: true,
    fetchedAt: '2026-04-01T12:00:00Z',
    publishedAt: null,
    ...overrides,
  };
}

describe('fetchAllSources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns results from all sources', async () => {
    mockFetchHN.mockResolvedValueOnce([
      makeStory({ id: 'hn-1', url: 'https://hn.com/1' }),
    ]);
    mockFetchGH.mockResolvedValueOnce([
      makeStory({
        id: 'gh-1',
        source: 'github-trending',
        url: 'https://github.com/a/b',
      }),
    ]);
    mockFetchLO.mockResolvedValueOnce([
      makeStory({
        id: 'lo-1',
        source: 'lobsters',
        url: 'https://lobste.rs/s/abc',
      }),
    ]);
    mockFetchDev.mockResolvedValueOnce([
      makeStory({ id: 'dev-1', source: 'devto', url: 'https://dev.to/x' }),
    ]);
    mockFetchRD.mockResolvedValueOnce([
      makeStory({ id: 'rd-1', source: 'reddit', url: 'https://reddit.com/x' }),
    ]);

    const results = await fetchAllSources(new Set());
    expect(results).toHaveLength(5);
    expect(results[0].source).toBe('hackernews');
    expect(results[1].source).toBe('github-trending');
    expect(results[2].source).toBe('lobsters');
    expect(results[3].source).toBe('devto');
    expect(results[4].source).toBe('reddit');
  });

  it('deduplicates against existing URLs', async () => {
    mockFetchHN.mockResolvedValueOnce([
      makeStory({ id: 'hn-1', url: 'https://example.com/existing' }),
      makeStory({ id: 'hn-2', url: 'https://example.com/new' }),
    ]);
    mockFetchGH.mockResolvedValueOnce([]);
    mockFetchLO.mockResolvedValueOnce([]);
    mockFetchDev.mockResolvedValueOnce([]);
    mockFetchRD.mockResolvedValueOnce([]);

    const existing = new Set(['example.com/existing']);
    const results = await fetchAllSources(existing);

    expect(results[0].stories).toHaveLength(1);
    expect(results[0].stories[0].id).toBe('hn-2');
  });

  it('handles source errors gracefully', async () => {
    mockFetchHN.mockRejectedValueOnce(new Error('HN is down'));
    mockFetchGH.mockResolvedValueOnce([
      makeStory({ id: 'gh-1', source: 'github-trending' }),
    ]);
    mockFetchLO.mockResolvedValueOnce([]);
    mockFetchDev.mockResolvedValueOnce([]);
    mockFetchRD.mockResolvedValueOnce([]);

    const results = await fetchAllSources(new Set());

    expect(results[0].source).toBe('hackernews');
    expect(results[0].stories).toHaveLength(0);
    expect(results[0].error).toBe('HN is down');

    expect(results[1].source).toBe('github-trending');
    expect(results[1].stories).toHaveLength(1);
    expect(results[1].error).toBeNull();
  });

  it('handles all sources failing', async () => {
    mockFetchHN.mockRejectedValueOnce(new Error('HN error'));
    mockFetchGH.mockRejectedValueOnce(new Error('GH error'));
    mockFetchLO.mockRejectedValueOnce(new Error('LO error'));
    mockFetchDev.mockRejectedValueOnce(new Error('DEV error'));
    mockFetchRD.mockRejectedValueOnce(new Error('RD error'));

    const results = await fetchAllSources(new Set());

    expect(results).toHaveLength(5);
    expect(results[0].error).toBe('HN error');
    expect(results[1].error).toBe('GH error');
    expect(results[2].error).toBe('LO error');
    expect(results[3].error).toBe('DEV error');
    expect(results[4].error).toBe('RD error');
  });

  it('handles non-Error throws', async () => {
    mockFetchHN.mockRejectedValueOnce('string error');
    mockFetchGH.mockResolvedValueOnce([]);
    mockFetchLO.mockResolvedValueOnce([]);
    mockFetchDev.mockResolvedValueOnce([]);
    mockFetchRD.mockResolvedValueOnce([]);

    const results = await fetchAllSources(new Set());
    expect(results[0].error).toBe('Unknown error');
  });
});

describe('buildExistingUrlSet', () => {
  it('builds a set of normalized URLs', () => {
    const stories = [
      makeStory({ url: 'https://example.com/a' }),
      makeStory({ url: 'https://example.com/b/' }),
    ];

    const set = buildExistingUrlSet(stories);
    expect(set.has('example.com/a')).toBe(true);
    expect(set.has('example.com/b')).toBe(true);
  });

  it('returns empty set for empty input', () => {
    const set = buildExistingUrlSet([]);
    expect(set.size).toBe(0);
  });
});
