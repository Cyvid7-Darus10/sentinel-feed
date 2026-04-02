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

  const errors: string[] = [];
  const seen = new Set<string>();
  const stories: Story[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'rejected') {
      errors.push(`r/${SUBREDDITS[i]}: ${result.reason}`);
      continue;
    }
    for (const story of result.value) {
      if (seen.has(story.url)) continue;
      seen.add(story.url);
      stories.push(story);
    }
  }

  // If ALL subreddits failed, throw so the error is visible in source health
  if (stories.length === 0 && errors.length > 0) {
    throw new Error(errors.join('; '));
  }

  if (errors.length > 0) {
    console.warn('[reddit] Partial failures:', errors.join('; '));
  }

  return stories;
}

async function fetchSubreddit(subreddit: string): Promise<Story[]> {
  // Use old.reddit.com — less aggressive with cloud IP blocking
  const res = await fetch(
    `https://old.reddit.com/r/${subreddit}/top.json?limit=${PER_SUBREDDIT}&t=day`,
    {
      headers: {
        'User-Agent': 'SentinelFeed/1.0 (tech news aggregator)',
        Accept: 'application/json',
      },
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `r/${subreddit}: HTTP ${res.status}${body.includes('<!') ? ' (HTML — likely blocked)' : ''}`
    );
  }

  const text = await res.text();

  // Reddit sometimes returns HTML (captcha/block page) with a 200 status
  if (text.startsWith('<!') || text.startsWith('<html')) {
    throw new Error(`r/${subreddit}: received HTML instead of JSON (blocked)`);
  }

  const listing: RedditListing = JSON.parse(text);
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
