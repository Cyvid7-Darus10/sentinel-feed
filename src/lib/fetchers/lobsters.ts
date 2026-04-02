import type { Story } from '../types';

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
  });

  if (!res.ok) {
    throw new Error(`Lobsters API error: ${res.status}`);
  }

  const items: LobstersItem[] = await res.json();
  const stories: Story[] = [];

  for (const item of items) {
    if (!item.title || !item.url) continue;

    stories.push({
      id: `lo-${item.short_id}`,
      source: 'lobsters',
      title: item.title,
      url: item.url,
      score: item.score,
      author: item.submitter_user ?? null,
      description: item.description_plain || null,
      tags: item.tags ?? [],
      summary: null,
      relevant: true,
      fetchedAt: new Date().toISOString(),
      publishedAt: item.created_at ?? null,
    });
  }

  return stories;
}
