import type { Story } from '../types';
import { fetchRssFeed } from './rss';

const TECHMEME_FEED_URL = 'https://www.techmeme.com/feed.xml';

export async function fetchTechmeme(): Promise<Story[]> {
  return fetchRssFeed({
    sourceId: 'techmeme',
    url: TECHMEME_FEED_URL,
    limit: 20,
  });
}
