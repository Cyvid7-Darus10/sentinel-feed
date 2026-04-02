import { describe, it, expect } from 'vitest';
import { TOPICS, categorizeTopic, categorizeStories } from '../topics';
import type { Story } from '../types';

function makeStory(overrides: Partial<Story> = {}): Story {
  return {
    id: 'test-1',
    source: 'hackernews',
    title: 'Test story',
    url: 'https://example.com',
    score: 10,
    author: 'user1',
    description: null,
    tags: [],
    summary: null,
    relevant: true,
    fetchedAt: '2026-04-01T00:00:00Z',
    publishedAt: null,
    ...overrides,
  };
}

describe('TOPICS', () => {
  it('has 6 topic categories', () => {
    expect(TOPICS).toHaveLength(6);
  });

  it('includes expected topic IDs', () => {
    const ids = TOPICS.map((t) => t.id);
    expect(ids).toEqual(['security', 'ai', 'systems', 'dev', 'tools', 'general']);
  });
});

describe('categorizeTopic', () => {
  it('detects security from title keywords', () => {
    expect(categorizeTopic(makeStory({ title: 'Critical CVE-2026-1234 discovered' }))).toBe('security');
    expect(categorizeTopic(makeStory({ title: 'Data breach at major company' }))).toBe('security');
    expect(categorizeTopic(makeStory({ title: 'New vulnerability in OpenSSL' }))).toBe('security');
    expect(categorizeTopic(makeStory({ title: 'Ransomware attack hits hospital' }))).toBe('security');
  });

  it('detects security from tags', () => {
    expect(categorizeTopic(makeStory({ tags: ['netsec'] }))).toBe('security');
    expect(categorizeTopic(makeStory({ tags: ['privacy'] }))).toBe('security');
  });

  it('detects AI/ML topics', () => {
    expect(categorizeTopic(makeStory({ title: 'New LLM beats GPT-4' }))).toBe('ai');
    expect(categorizeTopic(makeStory({ title: 'Machine learning for beginners' }))).toBe('ai');
    expect(categorizeTopic(makeStory({ title: 'Claude 4 released by Anthropic' }))).toBe('ai');
    expect(categorizeTopic(makeStory({ title: 'Deep learning with neural networks' }))).toBe('ai');
  });

  it('detects systems topics', () => {
    expect(categorizeTopic(makeStory({ title: 'Linux kernel 7.0 released' }))).toBe('systems');
    expect(categorizeTopic(makeStory({ title: 'Writing a compiler from scratch' }))).toBe('systems');
    expect(categorizeTopic(makeStory({ title: 'PostgreSQL performance tuning' }))).toBe('systems');
  });

  it('detects tools/devops topics', () => {
    expect(categorizeTopic(makeStory({ title: 'Deploying with Kubernetes in production' }))).toBe('tools');
    expect(categorizeTopic(makeStory({ title: 'AWS Lambda best practices' }))).toBe('tools');
    expect(categorizeTopic(makeStory({ title: 'Terraform modules guide' }))).toBe('tools');
  });

  it('detects tools from tags', () => {
    expect(categorizeTopic(makeStory({ tags: ['devops'] }))).toBe('tools');
    expect(categorizeTopic(makeStory({ tags: ['practices'] }))).toBe('tools');
  });

  it('detects dev topics from title', () => {
    expect(categorizeTopic(makeStory({ title: 'Rust 2026 edition is here' }))).toBe('dev');
    expect(categorizeTopic(makeStory({ title: 'React 20 new features' }))).toBe('dev');
    expect(categorizeTopic(makeStory({ title: 'TypeScript tips for beginners' }))).toBe('dev');
  });

  it('detects dev topics from tags', () => {
    expect(categorizeTopic(makeStory({ tags: ['python'] }))).toBe('dev');
    expect(categorizeTopic(makeStory({ tags: ['rust'] }))).toBe('dev');
  });

  it('falls back to general for unmatched stories', () => {
    expect(categorizeTopic(makeStory({ title: 'My weekend project recap' }))).toBe('general');
  });

  it('uses description for classification', () => {
    expect(
      categorizeTopic(
        makeStory({ title: 'Check this out', description: 'A vulnerability in the auth system' })
      )
    ).toBe('security');
  });

  it('uses tags text for classification', () => {
    expect(
      categorizeTopic(makeStory({ title: 'News update', tags: ['exploit', 'research'] }))
    ).toBe('security');
  });
});

describe('categorizeStories', () => {
  it('returns a bucket for each topic', () => {
    const result = categorizeStories([]);
    const keys = Object.keys(result);
    expect(keys).toHaveLength(6);
    for (const topic of TOPICS) {
      expect(result[topic.id]).toEqual([]);
    }
  });

  it('places stories into correct buckets', () => {
    const stories = [
      makeStory({ id: '1', title: 'CVE found in library', score: 5 }),
      makeStory({ id: '2', title: 'LLM training guide', score: 10 }),
      makeStory({ id: '3', title: 'Weekend hobby', score: 3 }),
    ];
    const result = categorizeStories(stories);
    expect(result.security).toHaveLength(1);
    expect(result.ai).toHaveLength(1);
    expect(result.general).toHaveLength(1);
  });

  it('sorts stories within buckets by score descending', () => {
    const stories = [
      makeStory({ id: '1', title: 'CVE alert', score: 5 }),
      makeStory({ id: '2', title: 'Security breach report', score: 20 }),
      makeStory({ id: '3', title: 'Malware analysis', score: 10 }),
    ];
    const result = categorizeStories(stories);
    expect(result.security.map((s) => s.score)).toEqual([20, 10, 5]);
  });

  it('handles null scores in sorting', () => {
    const stories = [
      makeStory({ id: '1', title: 'CVE alert', score: null }),
      makeStory({ id: '2', title: 'Security breach', score: 10 }),
    ];
    const result = categorizeStories(stories);
    expect(result.security[0].score).toBe(10);
    expect(result.security[1].score).toBeNull();
  });
});
