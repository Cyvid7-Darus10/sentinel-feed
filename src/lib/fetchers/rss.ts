import * as cheerio from 'cheerio';
import type { Story, SourceId } from '../types';
import { createStory } from './create-story';
import { FETCHER_TIMEOUT_MS } from '../config';

interface RssParseOptions {
  readonly sourceId: SourceId;
  readonly url: string;
  readonly limit?: number;
}

export async function fetchRssFeed({
  sourceId,
  url,
  limit = 25,
}: RssParseOptions): Promise<Story[]> {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/rss+xml, application/xml, text/xml',
      'User-Agent': 'SentinelFeed/1.0',
    },
    signal: AbortSignal.timeout(FETCHER_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`RSS fetch ${sourceId}: ${res.status}`);
  }

  const xml = await res.text();
  return parseRss(xml, sourceId, limit);
}

function parseRss(
  xml: string,
  sourceId: SourceId,
  limit: number
): Story[] {
  const $ = cheerio.load(xml, { xml: true });
  const stories: Story[] = [];

  // Handle both RSS 2.0 (<item>) and Atom (<entry>)
  const items = $('item').length > 0 ? $('item') : $('entry');

  items.each((i, el) => {
    if (i >= limit) return false;

    const $el = $(el);

    const title = ($el.find('title').first().text() ?? '').trim();
    const link =
      $el.find('link').first().text().trim() ||
      $el.find('link').first().attr('href') ||
      '';
    const pubDate =
      $el.find('pubDate').text().trim() ||
      $el.find('dc\\:date').text().trim() ||
      $el.find('published').text().trim() ||
      '';
    const author =
      $el.find('dc\\:creator').text().trim() ||
      $el.find('author name').text().trim() ||
      '';
    const description =
      $el.find('description').text().trim().slice(0, 200) || null;

    // Collect categories/tags
    const tags: string[] = [];
    $el.find('category, dc\\:subject').each((_, cat) => {
      const tag = $(cat).text().trim().toLowerCase();
      if (tag && !tags.includes(tag)) tags.push(tag);
    });

    if (!title || !link) return;

    const publishedAt = pubDate ? safeDate(pubDate) : null;

    stories.push(createStory(sourceId, {
      id: `${sourceId}-${hashCode(link)}`,
      title,
      url: link,
      author: author || null,
      description,
      tags: tags.slice(0, 5),
      publishedAt,
    }));
  });

  return stories;
}

function safeDate(dateStr: string): string | null {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}
