import type { Story } from '../types';

const SUBREDDITS = ['programming', 'netsec', 'devops'];
const PER_SUBREDDIT = 15;

interface RedditPost {
  data: {
    id: string;
    title: string;
    url: string;
    selftext: string;
    author: string;
    score: number;
    num_comments: number;
    created: number;
    domain: string;
    is_self: boolean;
    over_18: boolean;
    permalink: string;
    subreddit: string;
  };
}

interface RedditListing {
  data: {
    children: RedditPost[];
  };
}

export async function fetchReddit(): Promise<Story[]> {
  const results = await Promise.allSettled(
    SUBREDDITS.map((sub) => fetchSubreddit(sub))
  );

  const seen = new Set<string>();
  const stories: Story[] = [];

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    for (const story of result.value) {
      if (seen.has(story.url)) continue;
      seen.add(story.url);
      stories.push(story);
    }
  }

  return stories;
}

async function fetchSubreddit(subreddit: string): Promise<Story[]> {
  const res = await fetch(
    `https://www.reddit.com/r/${subreddit}/top.json?limit=${PER_SUBREDDIT}&t=day`,
    {
      headers: {
        'User-Agent': 'SentinelFeed/1.0',
        Accept: 'application/json',
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Reddit r/${subreddit}: ${res.status}`);
  }

  const listing: RedditListing = await res.json();
  const stories: Story[] = [];

  for (const post of listing.data.children) {
    const d = post.data;
    if (!d.title || d.over_18) continue;

    const url = d.is_self
      ? `https://www.reddit.com${d.permalink}`
      : d.url;

    stories.push({
      id: `rd-${d.id}`,
      source: 'reddit',
      title: d.title,
      url,
      score: d.score,
      author: d.author ?? null,
      description: d.selftext ? d.selftext.slice(0, 200) : null,
      tags: [d.subreddit],
      summary: null,
      relevant: true,
      fetchedAt: new Date().toISOString(),
      publishedAt: d.created
        ? new Date(d.created * 1000).toISOString()
        : null,
    });
  }

  return stories;
}
