import type { Story } from '../types';
import { createStory } from './create-story';
import { FETCHER_TIMEOUT_MS } from '../config';

const LOBSTERS_API = 'https://lobste.rs/hottest.json';

interface LobstersItem {
  short_id: string;
  created_at: string;
  title: string;
  url: string;
  score: number;
  comment_count: number;
  description_plain: string;
  submitter_user: string;
  tags: string[];
  comments_url: string;
}

export async function fetchLobsters(): Promise<Story[]> {
  const res = await fetch(LOBSTERS_API, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(FETCHER_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Lobsters API error: ${res.status}`);
  }

  const items: LobstersItem[] = await res.json();
  const stories: Story[] = [];

  for (const item of items) {
    if (!item.title) continue;
    const url = item.url || item.comments_url;
    if (!url) continue;

    stories.push(createStory('lobsters', {
      id: `lo-${item.short_id}`,
      title: item.title,
      url,
      score: item.score,
      author: item.submitter_user,
      description: item.description_plain || null,
      tags: item.tags,
      publishedAt: item.created_at,
    }));
  }

  return stories;
}
