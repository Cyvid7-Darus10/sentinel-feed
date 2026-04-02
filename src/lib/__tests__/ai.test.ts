import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Story } from '../types';

// Mock the 'ai' module
vi.mock('ai', () => ({
  generateText: vi.fn(),
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

describe('enrichStories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array for empty input', async () => {
    const result = await enrichStories([]);
    expect(result).toEqual([]);
    expect(mockGenerateText).not.toHaveBeenCalled();
  });

  it('enriches stories with AI response', async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: '[{"relevant": true, "summary": "New Rust compiler built fast"}]',
    } as never);

    const stories = [makeStory({ title: 'Rust compiler in 30 days' })];
    const result = await enrichStories(stories);

    expect(result).toHaveLength(1);
    expect(result[0].relevant).toBe(true);
    expect(result[0].summary).toBe('New Rust compiler built fast');
  });

  it('handles multiple stories', async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: JSON.stringify([
        { relevant: true, summary: 'Summary 1' },
        { relevant: false, summary: null },
        { relevant: true, summary: 'Summary 3' },
      ]),
    } as never);

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

  it('returns stories without summaries when AI fails', async () => {
    mockGenerateText.mockRejectedValueOnce(new Error('API error'));

    const stories = [makeStory()];
    const result = await enrichStories(stories);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Test Story');
    expect(result[0].summary).toBeNull();
  });

  it('handles markdown-wrapped JSON response', async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: '```json\n[{"relevant": true, "summary": "Cool stuff"}]\n```',
    } as never);

    const result = await enrichStories([makeStory()]);
    expect(result[0].summary).toBe('Cool stuff');
  });

  it('handles mismatched array length gracefully', async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: '[{"relevant": true, "summary": "Only one"}]',
    } as never);

    const stories = [makeStory({ id: 'hn-1' }), makeStory({ id: 'hn-2' })];
    const result = await enrichStories(stories);

    // Should fallback to defaults when count mismatch
    expect(result).toHaveLength(2);
    expect(result[0].relevant).toBe(true);
    expect(result[0].summary).toBeNull();
  });

  it('handles non-JSON AI response', async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: 'Sorry, I cannot process this request.',
    } as never);

    const result = await enrichStories([makeStory()]);
    expect(result[0].relevant).toBe(true);
    expect(result[0].summary).toBeNull();
  });

  it('truncates long summaries to 120 chars', async () => {
    const longSummary = 'A'.repeat(200);
    mockGenerateText.mockResolvedValueOnce({
      text: JSON.stringify([{ relevant: true, summary: longSummary }]),
    } as never);

    const result = await enrichStories([makeStory()]);
    expect(result[0].summary!.length).toBe(120);
  });

  it('handles non-boolean relevant field', async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: '[{"relevant": "yes", "summary": "test"}]',
    } as never);

    const result = await enrichStories([makeStory()]);
    // Non-boolean defaults to true
    expect(result[0].relevant).toBe(true);
  });

  it('handles non-string summary field', async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: '[{"relevant": true, "summary": 123}]',
    } as never);

    const result = await enrichStories([makeStory()]);
    expect(result[0].summary).toBeNull();
  });

  it('includes description in AI prompt when available', async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: '[{"relevant": true, "summary": "test"}]',
    } as never);

    await enrichStories([makeStory({ description: 'A cool project' })]);

    const call = mockGenerateText.mock.calls[0][0] as { prompt: string };
    expect(call.prompt).toContain('A cool project');
  });
});
