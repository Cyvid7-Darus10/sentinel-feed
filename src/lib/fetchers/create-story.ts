import type { Story, SourceId } from '../types';

interface StoryInput {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly score?: number | null;
  readonly author?: string | null;
  readonly description?: string | null;
  readonly tags?: readonly string[];
  readonly publishedAt?: string | null;
}

/** Build a Story object with sensible defaults. */
export function createStory(source: SourceId, input: StoryInput): Story {
  return {
    id: input.id,
    source,
    title: input.title,
    url: input.url,
    score: input.score ?? null,
    author: input.author ?? null,
    description: input.description ?? null,
    tags: input.tags ? [...input.tags] : [],
    summary: null,
    relevant: true,
    fetchedAt: new Date().toISOString(),
    publishedAt: input.publishedAt ?? null,
  };
}
