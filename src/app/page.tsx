import { TacticalMap } from '@/components/tactical-map';
import { readStoriesForDays, readSourceHealth } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [stories, health] = await Promise.all([
    readStoriesForDays(1),
    readSourceHealth(),
  ]);

  return <TacticalMap initialStories={stories} initialHealth={health} />;
}
