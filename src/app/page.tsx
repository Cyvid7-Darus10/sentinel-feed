import { ClassificationBanner } from '@/components/classification-banner';
import { Header } from '@/components/header';
import { SourcePanel } from '@/components/source-panel';
import { StoryFeed } from '@/components/story-feed';
import { readStoriesForDays, readSourceHealth } from '@/lib/storage';
import { relativeTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [stories, health] = await Promise.all([
    readStoriesForDays(1),
    readSourceHealth(),
  ]);

  const sourceCount = Object.keys(health.sources).length;
  const lastUpdate = health.updatedAt ? relativeTime(health.updatedAt) : null;

  return (
    <div className="flex min-h-screen flex-col">
      <ClassificationBanner />
      <Header
        storyCount={stories.length}
        sourceCount={sourceCount}
        lastUpdate={lastUpdate}
      />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 lg:w-64">
          <SourcePanel health={health} />
        </aside>

        {/* Main Feed */}
        <section className="flex-1">
          <StoryFeed initialStories={stories} initialHealth={health} />
        </section>
      </main>

      <footer className="border-t border-border bg-bg-primary px-4 py-2 text-center text-[10px] uppercase tracking-[0.15em] text-text-muted">
        Sentinel Feed v1.0 — Powered by Claude AI + Vercel
      </footer>
    </div>
  );
}
