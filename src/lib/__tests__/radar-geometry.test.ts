import { describe, it, expect } from 'vitest';
import { seededRandom, normalBetween, sectorPath, plotStories } from '../radar-geometry';
import type { Story } from '../types';

function makeStory(overrides: Partial<Story> = {}): Story {
  return {
    id: 'hn-1',
    source: 'hackernews',
    title: 'Story',
    url: 'https://example.com',
    score: 100,
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

describe('seededRandom', () => {
  it('is deterministic for the same seed', () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('produces values in [0, 1)', () => {
    const rng = seededRandom(7);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('normalBetween', () => {
  it('stays within [min, max]', () => {
    const rng = seededRandom(1);
    for (let i = 0; i < 100; i++) {
      const v = normalBetween(rng, 10, 20);
      expect(v).toBeGreaterThanOrEqual(10);
      expect(v).toBeLessThanOrEqual(20);
    }
  });
});

describe('sectorPath', () => {
  it('returns a closed SVG path starting at the center', () => {
    const path = sectorPath(100, 100, 50, 0, Math.PI / 2);
    expect(path).toMatch(/^M100,100 L/);
    expect(path.endsWith('Z')).toBe(true);
    expect(path).toContain('A50,50');
  });

  it('sets the large-arc flag only for arcs over 180°', () => {
    expect(sectorPath(0, 0, 10, 0, Math.PI / 2)).toContain(' 0 1 ');
    expect(sectorPath(0, 0, 10, 0, Math.PI * 1.5)).toContain(' 1 1 ');
  });
});

describe('plotStories', () => {
  it('plots every story exactly once', () => {
    const stories = Array.from({ length: 12 }, (_, i) =>
      makeStory({ id: `hn-${i}`, title: `Story ${i}`, score: i * 10 })
    );
    const plotted = plotStories(stories, 350, 350, 280);
    expect(plotted).toHaveLength(12);
  });

  it('keeps every dot within the outer ring and outside the dead zone', () => {
    const stories = Array.from({ length: 30 }, (_, i) =>
      makeStory({ id: `hn-${i}`, title: `t${i}`, score: (i % 5) * 20 })
    );
    const cx = 350;
    const cy = 350;
    const radius = 280;
    for (const p of plotStories(stories, cx, cy, radius)) {
      const dist = Math.hypot(p.x - cx, p.y - cy);
      expect(dist).toBeLessThanOrEqual(radius * 0.93 + 0.001);
      expect(dist).toBeGreaterThanOrEqual(radius * 0.1 - 0.001);
    }
  });

  it('marks critical stories with a larger dot radius', () => {
    const [plotted] = plotStories(
      [makeStory({ title: 'Critical RCE vulnerability in OpenSSL' })],
      350,
      350,
      280
    );
    expect(plotted.critical).toBe(true);
    expect(plotted.dotR).toBe(6);
  });

  it('is deterministic for the same input', () => {
    const stories = [makeStory({ id: 'hn-x', title: 'Deterministic test' })];
    const first = plotStories(stories, 350, 350, 280);
    const second = plotStories(stories, 350, 350, 280);
    expect(first).toEqual(second);
  });
});

describe('plotStories with enriched fields', () => {
  it('places a story in its AI-assigned sector, not the regex sector', () => {
    // Regex would file this under security ("leak"); AI says systems (topicIdx 2).
    const story = makeStory({ title: 'Fixing a memory leak in Go', topic: 'systems' });
    const [plotted] = plotStories([story], 200, 200, 180);
    expect(plotted.topicIdx).toBe(2);
  });

  it('pulls a high-importance no-score story toward the center', () => {
    const important = makeStory({
      id: 'imp', source: 'techmeme', score: null, importance: 95,
    });
    const unranked = makeStory({
      id: 'meh', source: 'techmeme', score: null, importance: null,
    });
    const plotted = plotStories([important, unranked], 200, 200, 180);
    const dist = (p: { x: number; y: number }) =>
      Math.hypot(p.x - 200, p.y - 200);
    const impDot = plotted.find((p) => p.story.id === 'imp')!;
    const mehDot = plotted.find((p) => p.story.id === 'meh')!;
    expect(dist(impDot)).toBeLessThan(dist(mehDot));
  });
});
