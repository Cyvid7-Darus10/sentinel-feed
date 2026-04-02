import type { Story } from '../types';
import { createStory } from './create-story';
import { FETCHER_TIMEOUT_MS } from '../config';

const HN_API = 'https://hacker-news.firebaseio.com/v0';
const TOP_STORIES_LIMIT = 30;

interface HNItem {
  id: number;
  type: string;
  by?: string;
  time?: number;
  title?: string;
  url?: string;
  score?: number;
  descendants?: number;
  text?: string;
}

export async function fetchHackerNews(): Promise<Story[]> {
  const res = await fetch(`${HN_API}/topstories.json`, {
    signal: AbortSignal.timeout(FETCHER_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`HN API error: ${res.status}`);
  }

  const ids: number[] = await res.json();
  const topIds = ids.slice(0, TOP_STORIES_LIMIT);

  const results = await Promise.allSettled(
    topIds.map((id) => fetchItem(id))
  );

  const stories: Story[] = [];
  for (const result of results) {
    if (result.status !== 'fulfilled' || !result.value) continue;
    const item = result.value;
    if (!item.title || !item.url) continue;

    stories.push(createStory('hackernews', {
      id: `hn-${item.id}`,
      title: item.title,
      url: item.url,
      score: item.score,
      author: item.by,
      description: item.text,
      publishedAt: item.time
        ? new Date(item.time * 1000).toISOString()
        : null,
    }));
  }

  return stories;
}

async function fetchItem(id: number): Promise<HNItem | null> {
  try {
    const res = await fetch(`${HN_API}/item/${id}.json`, {
      signal: AbortSignal.timeout(FETCHER_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as HNItem;
  } catch {
    return null;
  }
}
