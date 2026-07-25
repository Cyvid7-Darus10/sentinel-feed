import { describe, it, expect } from 'vitest';
import { createStory } from '../create-story';

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
});
