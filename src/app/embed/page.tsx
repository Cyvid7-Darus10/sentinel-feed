import { readStoriesForDays } from '@/lib/storage';
import { EmbedView } from '@/components/embed-view';

export const dynamic = 'force-dynamic';

export default async function EmbedPage() {
  const stories = await readStoriesForDays(1);

  return <EmbedView initialStories={stories} />;
}
