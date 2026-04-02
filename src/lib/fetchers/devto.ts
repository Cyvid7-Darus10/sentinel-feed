import type { Story } from '../types';

const DEVTO_API = 'https://dev.to/api/articles';

interface DevtoArticle {
  id: number;
  title: string;
  description: string;
  url: string;
  published_at: string;
  reading_time_minutes: number;
  tag_list: string[];
  public_reactions_count: number;
  comments_count: number;
  user: {
    name: string;
    username: string;
  };
}

export async function fetchDevto(): Promise<Story[]> {
  // top=1 means "top articles from the last 1 day"
  const res = await fetch(`${DEVTO_API}?top=1&per_page=30`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`Dev.to API error: ${res.status}`);
  }

  const articles: DevtoArticle[] = await res.json();
  const stories: Story[] = [];

  for (const article of articles) {
    if (!article.title || !article.url) continue;

    stories.push({
      id: `dev-${article.id}`,
      source: 'devto',
      title: article.title,
      url: article.url,
      score: article.public_reactions_count,
      author: article.user?.username ?? null,
      description: article.description || null,
      tags: article.tag_list ?? [],
      summary: null,
      relevant: true,
      fetchedAt: new Date().toISOString(),
      publishedAt: article.published_at ?? null,
    });
  }

  return stories;
}
