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

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET must be set — ' +
        'create a script app at https://www.reddit.com/prefs/apps'
    );
  }

  // Reuse token if still valid (with 60s margin)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'SentinelFeed/1.0',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    throw new Error(`Reddit OAuth failed: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.token;
}

export async function fetchReddit(): Promise<Story[]> {
  const token = await getAccessToken();

  const results = await Promise.allSettled(
    SUBREDDITS.map((sub) => fetchSubreddit(sub, token))
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

  if (stories.length === 0 && errors.length > 0) {
    throw new Error(errors.join('; '));
  }

  if (errors.length > 0) {
    console.warn('[reddit] Partial failures:', errors.join('; '));
  }

  return stories;
}

async function fetchSubreddit(
  subreddit: string,
  token: string
): Promise<Story[]> {
  // Use oauth.reddit.com — the authenticated endpoint that works from cloud IPs
  const res = await fetch(
    `https://oauth.reddit.com/r/${subreddit}/top?limit=${PER_SUBREDDIT}&t=day`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'SentinelFeed/1.0',
      },
    }
  );

  if (!res.ok) {
    throw new Error(`r/${subreddit}: HTTP ${res.status}`);
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
