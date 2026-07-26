import type { Story, SourceId } from '../types';

/** Upper bounds on stored text, so a misbehaving upstream cannot bloat the
 *  daily blob with an unbounded title or description. Applied uniformly to
 *  every source at the one place stories are built. */
export const MAX_TITLE_LENGTH = 500;
export const MAX_DESCRIPTION_LENGTH = 1000;

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

/** Fills in the fields every fetcher would otherwise repeat: empty tags, null score,
 *  `relevant: true` until AI says otherwise, and fetchedAt stamped now. */
export function createStory(source: SourceId, input: StoryInput): Story {
  return {
    id: input.id,
    source,
    title: input.title.slice(0, MAX_TITLE_LENGTH),
    url: input.url,
    score: input.score ?? null,
    author: input.author ?? null,
    description: input.description
      ? input.description.slice(0, MAX_DESCRIPTION_LENGTH)
      : null,
    tags: input.tags ? [...input.tags] : [],
    summary: null,
    relevant: true,
    fetchedAt: new Date().toISOString(),
    publishedAt: input.publishedAt ?? null,
    topic: null,
    importance: null,
  };
}
