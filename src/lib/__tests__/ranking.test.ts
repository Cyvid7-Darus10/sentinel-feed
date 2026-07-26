import { describe, it, expect } from 'vitest';
import type { Story } from '../types';
import { rankStories, sortStoriesByRank } from '../ranking';

function makeStory(overrides: Partial<Story> = {}): Story {
  return {
    id: 'hn-1',
    source: 'hackernews',
    title: 'Test Story',
    url: 'https://example.com',
    score: 100,
    author: null,
    description: null,
    tags: [],
    summary: null,
    relevant: true,
    topic: null,
    importance: null,
    fetchedAt: '2026-07-25T12:00:00Z',
    publishedAt: null,
    ...overrides,
  };
}

describe('rankStories', () => {
  it('blends per-source score percentile with importance 50/50', () => {
    const stories = [
      makeStory({ id: 'a', score: 10, importance: 100 }),
      makeStory({ id: 'b', score: 50, importance: 100 }),
      makeStory({ id: 'c', score: 90, importance: 100 }),
    ];
    const ranks = rankStories(stories);
    // Percentiles within hackernews: a=0, b=0.5, c=1. Importance term: 0.5 each.
    expect(ranks.get('a')).toBeCloseTo(0.5);
    expect(ranks.get('b')).toBeCloseTo(0.75);
    expect(ranks.get('c')).toBeCloseTo(1.0);
  });

  it('computes percentiles per source, not globally', () => {
    const stories = [
      makeStory({ id: 'hn-big', source: 'hackernews', score: 900 }),
      makeStory({ id: 'hn-small', source: 'hackernews', score: 10 }),
      makeStory({ id: 'devto-top', source: 'devto', score: 80 }),
      makeStory({ id: 'devto-low', source: 'devto', score: 5 }),
    ];
    const ranks = rankStories(stories);
    // 80 Dev.to reactions tops its source just like 900 HN points tops its own.
    expect(ranks.get('devto-top')).toBeCloseTo(ranks.get('hn-big')!);
  });

  it('uses percentile alone when importance is null', () => {
    const stories = [
      makeStory({ id: 'a', score: 10, importance: null }),
      makeStory({ id: 'b', score: 90, importance: null }),
    ];
    const ranks = rankStories(stories);
    expect(ranks.get('a')).toBeCloseTo(0);
    expect(ranks.get('b')).toBeCloseTo(1);
  });

  it('uses importance alone when score is null (RSS sources)', () => {
    const stories = [
      makeStory({ id: 'tm', source: 'techmeme', score: null, importance: 80 }),
    ];
    expect(rankStories(stories).get('tm')).toBeCloseTo(0.8);
  });

  it('ranks 0 when both score and importance are null', () => {
    const stories = [makeStory({ id: 'x', score: null, importance: null })];
    expect(rankStories(stories).get('x')).toBe(0);
  });

  it('gives a lone scored story in a source percentile 1.0', () => {
    const stories = [makeStory({ id: 'only', score: 3, importance: null })];
    expect(rankStories(stories).get('only')).toBe(1);
  });

  it('lets an important no-score story outrank a high-upvote fluff story', () => {
    const stories = [
      makeStory({ id: 'fluff', source: 'hackernews', score: 900, importance: 10 }),
      makeStory({ id: 'cve', source: 'techmeme', score: null, importance: 95 }),
    ];
    const ranks = rankStories(stories);
    expect(ranks.get('cve')!).toBeGreaterThan(ranks.get('fluff')!);
  });
});

describe('sortStoriesByRank', () => {
  it('sorts descending by rank without mutating the input', () => {
    const low = makeStory({ id: 'low', score: 10 });
    const high = makeStory({ id: 'high', score: 90 });
    const input = [low, high];
    const sorted = sortStoriesByRank(input);
    expect(sorted.map((s) => s.id)).toEqual(['high', 'low']);
    expect(input.map((s) => s.id)).toEqual(['low', 'high']);
  });

  it('breaks rank ties by fetchedAt recency', () => {
    const older = makeStory({ id: 'older', score: 50, fetchedAt: '2026-07-25T01:00:00Z' });
    const newer = makeStory({ id: 'newer', score: 50, fetchedAt: '2026-07-25T09:00:00Z' });
    const sorted = sortStoriesByRank([older, newer]);
    expect(sorted.map((s) => s.id)).toEqual(['newer', 'older']);
  });
});
