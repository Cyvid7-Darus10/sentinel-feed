import { readStoriesForDays } from '@/lib/storage';
import { sortStoriesByRank } from '@/lib/ranking';
import { EmbedView } from '@/components/organisms/embed-view';

export const dynamic = 'force-dynamic';

export default async function EmbedPage() {
  const stories = await readStoriesForDays(1);

  return <EmbedView initialStories={sortStoriesByRank(stories)} />;
}
