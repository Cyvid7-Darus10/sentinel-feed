import type { Story } from '../types';
import { createStory } from './create-story';
import { FETCHER_TIMEOUT_MS } from '../config';

const DAILYDEV_API = 'https://api.daily.dev/graphql';
const POSTS_LIMIT = 25;

const QUERY = `{
  mostUpvotedFeed(first: ${POSTS_LIMIT}) {
    edges {
      node {
        id
        title
        url
        createdAt
        numUpvotes
        numComments
        source { name }
        tags
      }
    }
  }
}`;

interface DailyDevNode {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  numUpvotes: number;
  numComments: number;
  source: { name: string } | null;
  tags: string[];
}

interface DailyDevResponse {
  data?: {
    mostUpvotedFeed?: {
      edges: { node: DailyDevNode }[];
    };
  };
  errors?: { message: string }[];
}

export async function fetchDailyDev(): Promise<Story[]> {
  const res = await fetch(DAILYDEV_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query: QUERY }),
    signal: AbortSignal.timeout(FETCHER_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`daily.dev API error: ${res.status}`);
  }

  const body: DailyDevResponse = await res.json();

  if (body.errors?.length) {
    throw new Error(`daily.dev GraphQL: ${body.errors[0].message}`);
  }

  const edges = body.data?.mostUpvotedFeed?.edges ?? [];
  const stories: Story[] = [];

  for (const { node } of edges) {
    if (!node.title || !node.url) continue;

    stories.push(createStory('dailydev', {
      id: `dd-${node.id}`,
      title: node.title,
      url: node.url,
      score: node.numUpvotes,
      author: node.source?.name,
      tags: node.tags,
      publishedAt: node.createdAt,
    }));
  }

  return stories;
}
