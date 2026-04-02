import { list, put, del, head, type ListBlobResult } from '@vercel/blob';
import type { Story, SourceHealth } from './types';
import { todayKey, daysAgoKeys } from './utils';

const FEED_PREFIX = 'feed/';
const META_PREFIX = 'meta/';

function feedPath(dateKey: string): string {
  return `${FEED_PREFIX}${dateKey}.json`;
}

function sourcesPath(): string {
  return `${META_PREFIX}sources.json`;
}

export async function readTodayStories(): Promise<Story[]> {
  return readStoriesForDate(todayKey());
}

export async function readStoriesForDate(dateKey: string): Promise<Story[]> {
  try {
    const blobUrl = await findBlobUrl(feedPath(dateKey));
    if (!blobUrl) return [];
    const res = await fetch(blobUrl);
    if (!res.ok) return [];
    return (await res.json()) as Story[];
  } catch {
    return [];
  }
}

export async function readStoriesForDays(days: number): Promise<Story[]> {
  const keys = daysAgoKeys(days);
  const results = await Promise.allSettled(
    keys.map((key) => readStoriesForDate(key))
  );
  const stories: Story[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      stories.push(...r.value);
    }
  }
  return stories;
}

export async function writeTodayStories(stories: readonly Story[]): Promise<void> {
  await put(feedPath(todayKey()), JSON.stringify(stories), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
}

export async function readSourceHealth(): Promise<SourceHealth> {
  try {
    const blobUrl = await findBlobUrl(sourcesPath());
    if (!blobUrl) return defaultSourceHealth();
    const res = await fetch(blobUrl);
    if (!res.ok) return defaultSourceHealth();
    return (await res.json()) as SourceHealth;
  } catch {
    return defaultSourceHealth();
  }
}

export async function writeSourceHealth(health: SourceHealth): Promise<void> {
  await put(sourcesPath(), JSON.stringify(health), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
  });
}

export async function deleteOldBlobs(retentionDays: number): Promise<string[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  const cutoffKey = cutoff.toISOString().slice(0, 10);

  const allBlobs: ListBlobResult['blobs'] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: FEED_PREFIX, cursor });
    allBlobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const toDelete: string[] = [];

  for (const blob of allBlobs) {
    const dateMatch = blob.pathname.match(/(\d{4}-\d{2}-\d{2})\.json$/);
    if (dateMatch && dateMatch[1] < cutoffKey) {
      toDelete.push(blob.url);
    }
  }

  if (toDelete.length > 0) {
    await del(toDelete);
  }

  return toDelete;
}

async function findBlobUrl(pathname: string): Promise<string | null> {
  try {
    const result = await head(pathname);
    return result.url;
  } catch {
    return null;
  }
}

function defaultSourceHealth(): SourceHealth {
  return {
    sources: {},
    updatedAt: new Date().toISOString(),
  };
}
