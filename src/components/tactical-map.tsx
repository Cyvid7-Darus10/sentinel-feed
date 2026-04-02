'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Story, SourceId, SourceHealth } from '@/lib/types';
import { TOPICS, categorizeStories } from '@/lib/topics';
import { relativeTime } from '@/lib/utils';
import { StoryNode } from './story-node';
import { SectorMap } from './sector-map';
import { RadarView } from './radar-view';

type ViewMode = 'list' | 'map' | 'radar';

type TimeRange = '6h' | '12h' | '24h' | '7d';

interface TacticalMapProps {
  readonly initialStories: readonly Story[];
  readonly initialHealth: SourceHealth;
}

function timeRangeToDays(range: TimeRange): number {
  return range === '7d' ? 7 : 1;
}

function timeRangeToMs(range: TimeRange): number {
  switch (range) {
    case '6h':
      return 6 * 3_600_000;
    case '12h':
      return 12 * 3_600_000;
    case '24h':
      return 24 * 3_600_000;
    case '7d':
      return 7 * 24 * 3_600_000;
  }
}

const SOURCES: readonly { id: SourceId | null; label: string }[] = [
  { id: null, label: 'ALL' },
  { id: 'hackernews', label: 'HN' },
  { id: 'github-trending', label: 'GH' },
  { id: 'lobsters', label: 'LO' },
  { id: 'devto', label: 'DEV' },
];

const TIME_RANGES: readonly { id: TimeRange; label: string }[] = [
  { id: '6h', label: '6H' },
  { id: '12h', label: '12H' },
  { id: '24h', label: '24H' },
  { id: '7d', label: '7D' },
];

export function TacticalMap({ initialStories, initialHealth }: TacticalMapProps) {
  const [stories, setStories] = useState<readonly Story[]>(initialStories);
  const [health, setHealth] = useState<SourceHealth>(initialHealth);
  const [activeSource, setActiveSource] = useState<SourceId | null>(null);
  const [activeRange, setActiveRange] = useState<TimeRange>('24h');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('radar');

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const days = timeRangeToDays(activeRange);
        const [storiesRes, healthRes] = await Promise.all([
          fetch(`/api/stories?days=${days}`),
          fetch('/api/sources'),
        ]);
        if (storiesRes.ok) {
          const data = await storiesRes.json();
          setStories(data.stories);
        }
        if (healthRes.ok) {
          const data = await healthRes.json();
          setHealth(data);
        }
      } catch {
        // next poll retries
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [activeRange]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Filter by source, time, search
  const filtered = useMemo(() => {
    const now = Date.now();
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
  }, [stories, activeSource, activeRange, searchQuery]);

  // Categorize into topics
  const categorized = useMemo(() => categorizeStories(filtered), [filtered]);

  // Topic counts for tabs
  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const topic of TOPICS) {
      counts[topic.id] = (categorized[topic.id] ?? []).length;
    }
    return counts;
  }, [categorized]);

  // Stories to display (filtered by active topic)
  const displayStories = useMemo(() => {
    if (!activeTopic) {
      // Show all, sorted by score desc
      return [...filtered].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    }
    return categorized[activeTopic] ?? [];
  }, [filtered, activeTopic, categorized]);

  // Get topic color for a story
  const getTopicColor = useCallback(
    (story: Story): string => {
      if (activeTopic) {
        return TOPICS.find((t) => t.id === activeTopic)?.color ?? '#94a3b8';
      }
      for (const topic of TOPICS) {
        if ((categorized[topic.id] ?? []).includes(story)) return topic.color;
      }
      return '#94a3b8';
    },
    [activeTopic, categorized]
  );

  const handleSelectTopic = useCallback((topicId: string) => {
    setActiveTopic(topicId);
    setViewMode('list');
  }, []);

  const sourceCount = Object.keys(health.sources).length;
  const lastUpdate = health.updatedAt ? relativeTime(health.updatedAt) : null;

  return (
    <div className="flex h-screen flex-col">
      {/* ── Header Bar ── */}
      <header className="border-b border-border bg-bg-primary">
        {/* Top row: brand + view toggle + search + stats */}
        <div className="flex items-center gap-x-4 px-4 py-2">
          <span className="shrink-0 text-[14px] font-bold uppercase tracking-[0.1em] text-text-bright">
            Sentinel
          </span>

          <div className="hidden h-4 w-px bg-border sm:block" />

          {/* View Toggle */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode('radar')}
              aria-pressed={viewMode === 'radar'}
              className={`filter-btn ${viewMode === 'radar' ? 'filter-btn-active' : 'filter-btn-inactive'}`}
              title="Radar view"
            >
              RADAR
            </button>
            <button
              onClick={() => setViewMode('map')}
              aria-pressed={viewMode === 'map'}
              className={`filter-btn ${viewMode === 'map' ? 'filter-btn-active' : 'filter-btn-inactive'}`}
              title="Sector map view"
            >
              MAP
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              className={`filter-btn ${viewMode === 'list' ? 'filter-btn-active' : 'filter-btn-inactive'}`}
              title="List view"
            >
              LIST
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search..."
            className="search-input hidden w-44 sm:block"
            aria-label="Search stories"
          />

          {/* Stats */}
          <div className="ml-auto flex shrink-0 items-center gap-3 text-[11px] text-text-secondary">
            <span>
              <span className="text-text-bright">{filtered.length}</span> stories
            </span>
            <span className="hidden sm:inline">
              <span className="text-text-bright">{sourceCount}</span> sources
            </span>
            {lastUpdate && (
              <span className="hidden lg:inline">
                updated <span className="text-success">{lastUpdate}</span>
              </span>
            )}
          </div>
        </div>

        {/* Bottom row: filters (scrollable on mobile) */}
        <div className="flex items-center gap-3 overflow-x-auto px-4 pb-2">
          {/* Source Filters */}
          <div className="flex shrink-0 items-center gap-1">
            {SOURCES.map((s) => (
              <button
                key={s.id ?? 'all'}
                onClick={() => setActiveSource(s.id)}
                aria-pressed={activeSource === s.id}
                className={`filter-btn ${
                  activeSource === s.id ? 'filter-btn-active' : 'filter-btn-inactive'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px shrink-0 bg-border" />

          {/* Time Filters */}
          <div className="flex shrink-0 items-center gap-1">
            {TIME_RANGES.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveRange(t.id)}
                aria-pressed={activeRange === t.id}
                className={`filter-btn ${
                  activeRange === t.id ? 'filter-btn-active' : 'filter-btn-inactive'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Mobile search (visible only on small screens) */}
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search..."
            className="search-input block w-36 shrink-0 sm:hidden"
            aria-label="Search stories"
          />
        </div>
      </header>

      {viewMode === 'list' && (
        <>
          {/* ── Topic Tabs ── */}
          <nav className="flex gap-0 overflow-x-auto border-b border-border bg-bg-primary px-3">
            <button
              onClick={() => setActiveTopic(null)}
              className={`topic-tab ${!activeTopic ? 'topic-tab-active' : ''}`}
              style={{ '--tab-color': '#34d399' } as React.CSSProperties}
            >
              ALL
              <span className="ml-1.5 text-[10px] opacity-50">{filtered.length}</span>
            </button>
            {TOPICS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setActiveTopic(activeTopic === topic.id ? null : topic.id)}
                className={`topic-tab ${activeTopic === topic.id ? 'topic-tab-active' : ''}`}
                style={{ '--tab-color': topic.color } as React.CSSProperties}
              >
                {topic.label}
                <span className="ml-1.5 text-[10px] opacity-50">
                  {topicCounts[topic.id] ?? 0}
                </span>
              </button>
            ))}
          </nav>

          {/* ── Story Feed ── */}
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl">
              {displayStories.length === 0 ? (
                <div className="px-5 py-16 text-center text-[12px] text-text-muted">
                  No stories match the current filters.
                </div>
              ) : (
                displayStories.map((story) => (
                  <StoryNode
                    key={story.id}
                    story={story}
                    topicColor={getTopicColor(story)}
                  />
                ))
              )}
            </div>
          </main>
        </>
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

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-bg-primary px-5 py-1.5 text-center text-[10px] text-text-muted">
        {displayStories.length} of {stories.length} stories — auto-refresh 60s
      </footer>
    </div>
  );
}
