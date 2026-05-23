'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Story, SourceId, SourceHealth } from '@/lib/types';
import { TOPICS, categorizeStories, categorizeTopic } from '@/lib/topics';
import { DEFAULT_TOPIC_COLOR } from '@/lib/config';
import { relativeTime } from '@/lib/utils';
import { type TimeRange, timeRangeToMs } from '@/lib/time-range';
import { useStoryFeed } from '../hooks/use-story-feed';
import { DashboardToolbar, type ViewMode } from '../organisms/dashboard-toolbar';
import { PromoBanner } from '../molecules/promo-banner';
import { StoryListView } from '../organisms/story-list-view';
import { SectorMap } from '../organisms/sector-map';
import { RadarView } from '../organisms/radar-view';

interface TacticalMapProps {
  readonly initialStories: readonly Story[];
  readonly initialHealth: SourceHealth;
}

export function TacticalMap({ initialStories, initialHealth }: TacticalMapProps) {
  const [activeSource, setActiveSource] = useState<SourceId | null>(null);
  const [activeRange, setActiveRange] = useState<TimeRange>('24h');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('radar');

  const { stories, health, rateLimited, now } = useStoryFeed(
    initialStories,
    initialHealth,
    activeRange
  );

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const filtered = useMemo(() => {
    const rangeMs = timeRangeToMs(activeRange);
    const q = searchQuery.toLowerCase();

    return stories.filter((s) => {
      if (activeSource && s.source !== activeSource) return false;
      const storyTime = new Date(s.publishedAt ?? s.fetchedAt).getTime();
      if (now - storyTime > rangeMs) return false;
      if (q) {
        const hay =
          `${s.title} ${s.summary ?? ''} ${s.author ?? ''} ${s.tags.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [stories, activeSource, activeRange, searchQuery, now]);

  const categorized = useMemo(() => categorizeStories(filtered), [filtered]);

  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const topic of TOPICS) {
      counts[topic.id] = (categorized[topic.id] ?? []).length;
    }
    return counts;
  }, [categorized]);

  const displayStories = useMemo(() => {
    if (!activeTopic) {
      return [...filtered].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    }
    return categorized[activeTopic] ?? [];
  }, [filtered, activeTopic, categorized]);

  const getTopicColor = useCallback(
    (story: Story): string => {
      const topicId = activeTopic ?? categorizeTopic(story);
      return TOPICS.find((t) => t.id === topicId)?.color ?? DEFAULT_TOPIC_COLOR;
    },
    [activeTopic]
  );

  const handleSelectTopic = useCallback((topicId: string) => {
    setActiveTopic(topicId);
    setViewMode('list');
  }, []);

  const sourceCount = Object.keys(health.sources).length;
  const lastUpdate = health.updatedAt ? relativeTime(health.updatedAt) : null;

  return (
    <div className="flex h-screen flex-col">
      <DashboardToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        activeSource={activeSource}
        onSourceChange={setActiveSource}
        activeRange={activeRange}
        onRangeChange={setActiveRange}
        storyCount={filtered.length}
        sourceCount={sourceCount}
        lastUpdate={lastUpdate}
      />

      {rateLimited && (
        <div className="flex items-center gap-3 border-b border-danger/30 bg-danger/5 px-4 py-2">
          <span className="text-[12px] text-danger">
            Too many requests — auto-refresh paused. Try again in a moment.
          </span>
        </div>
      )}

      <PromoBanner />

      {viewMode === 'list' && (
        <StoryListView
          activeTopic={activeTopic}
          onTopicChange={setActiveTopic}
          totalCount={filtered.length}
          topicCounts={topicCounts}
          displayStories={displayStories}
          getTopicColor={getTopicColor}
        />
      )}

      {viewMode === 'map' && (
        <main className="flex-1 overflow-hidden">
          <SectorMap stories={filtered} onSelectTopic={handleSelectTopic} />
        </main>
      )}

      {viewMode === 'radar' && (
        <main className="flex-1 overflow-hidden">
          <RadarView stories={filtered} onSelectTopic={handleSelectTopic} />
        </main>
      )}

      <footer className="flex items-center justify-between border-t border-border bg-bg-primary px-5 py-1.5 text-[10px] text-text-muted">
        <span>{displayStories.length} of {stories.length} stories — auto-refresh 60s</span>
        <nav className="flex gap-3" aria-label="Legal">
          <a href="/privacy" className="transition-colors hover:text-text-secondary">Privacy</a>
          <a href="/terms" className="transition-colors hover:text-text-secondary">Terms</a>
          <a href="/accessibility" className="transition-colors hover:text-text-secondary">Accessibility</a>
        </nav>
      </footer>
    </div>
  );
}
