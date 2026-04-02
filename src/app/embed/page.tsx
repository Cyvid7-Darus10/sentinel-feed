import { readStoriesForDays, readSourceHealth } from '@/lib/storage';
import { EmbedView } from '@/components/embed-view';

export const dynamic = 'force-dynamic';

export default async function EmbedPage() {
  const [stories, health] = await Promise.all([
    readStoriesForDays(1),
    readSourceHealth(),
  ]);

  return <EmbedView initialStories={stories} initialHealth={health} />;
}
