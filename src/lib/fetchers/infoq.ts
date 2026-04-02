import type { Story } from '../types';
import { fetchRssFeed } from './rss';

const INFOQ_FEED_URL = 'https://feed.infoq.com/';

export async function fetchInfoQ(): Promise<Story[]> {
  return fetchRssFeed({
    sourceId: 'infoq',
    url: INFOQ_FEED_URL,
    limit: 20,
  });
}
