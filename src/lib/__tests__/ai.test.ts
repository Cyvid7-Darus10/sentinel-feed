import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Story } from '../types';

// Mock the 'ai' module. `Output.array` just needs to be callable; the mocked
// generateText ignores its arguments and returns canned structured output.
vi.mock('ai', () => ({
  generateText: vi.fn(),
  Output: { array: vi.fn((config) => config) },
}));

import { enrichStories } from '../ai';
import { generateText } from 'ai';

const mockGenerateText = vi.mocked(generateText);

function makeStory(overrides: Partial<Story> = {}): Story {
  return {
    id: 'hn-123',
    source: 'hackernews',
    title: 'Test Story',
    url: 'https://example.com',
    score: 100,
    author: 'testuser',
    description: null,
    tags: [],
    summary: null,
    relevant: true,
    fetchedAt: '2026-04-01T12:00:00Z',
    publishedAt: null,
    ...overrides,
  };
}

/** Build a resolved generateText result with structured `output`. */
function aiOutput(results: Array<{ relevant: boolean; summary: string | null }>) {
  return { output: results } as never;
}

describe('enrichStories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.ENABLE_AI_ENRICHMENT;
  });

  it('returns empty array for empty input', async () => {
    const result = await enrichStories([]);
    expect(result).toEqual([]);
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it('skips AI entirely when ENABLE_AI_ENRICHMENT is "false"', async () => {
    process.env.ENABLE_AI_ENRICHMENT = 'false';

    const stories = [makeStory({ summary: null })];
    const result = await enrichStories(stories);

    expect(mockGenerateText).not.toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].summary).toBeNull();
  });

  it('enriches stories with AI response', async () => {
    mockGenerateText.mockResolvedValueOnce(
      aiOutput([{ relevant: true, summary: 'New Rust compiler built fast' }])
    );

    const stories = [makeStory({ title: 'Rust compiler in 30 days' })];
    const result = await enrichStories(stories);

    expect(result).toHaveLength(1);
    expect(result[0].relevant).toBe(true);
    expect(result[0].summary).toBe('New Rust compiler built fast');
  });

  it('handles multiple stories, mapping results positionally', async () => {
    mockGenerateText.mockResolvedValueOnce(
      aiOutput([
        { relevant: true, summary: 'Summary 1' },
        { relevant: false, summary: null },
        { relevant: true, summary: 'Summary 3' },
      ])
    );

    const stories = [
      makeStory({ id: 'hn-1', title: 'Story 1' }),
      makeStory({ id: 'hn-2', title: 'Story 2' }),
      makeStory({ id: 'hn-3', title: 'Story 3' }),
    ];

    const result = await enrichStories(stories);

    expect(result).toHaveLength(3);
    expect(result[0].summary).toBe('Summary 1');
    expect(result[1].relevant).toBe(false);
    expect(result[2].summary).toBe('Summary 3');
  });

  it('returns stories without summaries when the AI call throws', async () => {
    // A malformed/unparseable model response surfaces as a thrown error
    // (e.g. NoObjectGeneratedError) from generateText.
    mockGenerateText.mockRejectedValueOnce(new Error('NoObjectGeneratedError'));

    const stories = [makeStory()];
    const result = await enrichStories(stories);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Test Story');
    expect(result[0].summary).toBeNull();
    expect(result[0].relevant).toBe(true);
  });

  it('falls back to neutral defaults on a count mismatch', async () => {
    mockGenerateText.mockResolvedValueOnce(
      aiOutput([{ relevant: true, summary: 'Only one' }])
    );

    const stories = [makeStory({ id: 'hn-1' }), makeStory({ id: 'hn-2' })];
    const result = await enrichStories(stories);

    expect(result).toHaveLength(2);
    expect(result[0].relevant).toBe(true);
    expect(result[0].summary).toBeNull();
    expect(result[1].summary).toBeNull();
  });

  it('truncates long summaries to 120 chars', async () => {
    const longSummary = 'A'.repeat(200);
    mockGenerateText.mockResolvedValueOnce(
      aiOutput([{ relevant: true, summary: longSummary }])
    );

    const result = await enrichStories([makeStory()]);
    expect(result[0].summary).toHaveLength(120);
  });

  it('passes stories beyond the batch cap through untouched', async () => {
    // 51 stories: first 50 enriched, the 51st passes through with defaults.
    const stories = Array.from({ length: 51 }, (_, i) =>
      makeStory({ id: `hn-${i}`, title: `Story ${i}` })
    );
    mockGenerateText.mockResolvedValueOnce(
      aiOutput(
        Array.from({ length: 50 }, () => ({ relevant: true, summary: 'ok' }))
      )
    );

    const result = await enrichStories(stories);

    expect(result).toHaveLength(51);
    expect(result[49].summary).toBe('ok');
    expect(result[50].summary).toBeNull(); // beyond the cap, untouched
  });

  it('includes the description in the AI prompt when available', async () => {
    mockGenerateText.mockResolvedValueOnce(
      aiOutput([{ relevant: true, summary: 'test' }])
    );

    await enrichStories([makeStory({ description: 'A cool project' })]);

    const call = mockGenerateText.mock.calls[0][0] as { prompt: string };
    expect(call.prompt).toContain('A cool project');
  });
});
