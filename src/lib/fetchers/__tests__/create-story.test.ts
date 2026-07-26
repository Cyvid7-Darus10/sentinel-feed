import { describe, it, expect } from 'vitest';
import { createStory, MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH } from '../create-story';

describe('createStory', () => {
  it('defaults topic and importance to null until enrichment fills them', () => {
    const story = createStory('hackernews', {
      id: 'hn-1',
      title: 'Test',
      url: 'https://example.com',
    });
    expect(story.topic).toBeNull();
    expect(story.importance).toBeNull();
  });

  it('caps an oversized title so one feed cannot bloat stored data', () => {
    const story = createStory('hackernews', {
      id: 'hn-1',
      title: 'A'.repeat(MAX_TITLE_LENGTH + 200),
      url: 'https://example.com',
    });
    expect(story.title).toHaveLength(MAX_TITLE_LENGTH);
  });

  it('caps an oversized description', () => {
    const story = createStory('hackernews', {
      id: 'hn-1',
      title: 'Test',
      url: 'https://example.com',
      description: 'B'.repeat(MAX_DESCRIPTION_LENGTH + 200),
    });
    expect(story.description).toHaveLength(MAX_DESCRIPTION_LENGTH);
  });

  it('leaves a null description untouched', () => {
    const story = createStory('hackernews', {
      id: 'hn-1',
      title: 'Test',
      url: 'https://example.com',
    });
    expect(story.description).toBeNull();
  });
});
