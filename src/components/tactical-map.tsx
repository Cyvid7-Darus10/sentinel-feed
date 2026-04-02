'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Story, SourceId, SourceHealth } from '@/lib/types';
import { TOPICS, categorizeStories } from '@/lib/topics';
import { relativeTime } from '@/lib/utils';
import { TopicSector } from './topic-sector';

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
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-refresh every 60s
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

  const handleSourceChange = useCallback((source: SourceId | null) => {
    setActiveSource(source);
  }, []);

  const handleRangeChange = useCallback((range: TimeRange) => {
    setActiveRange(range);
  }, []);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Filter
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

  // Categorize
  const categorized = useMemo(() => categorizeStories(filtered), [filtered]);

  const totalSignals = filtered.length;
  const sourceCount = Object.keys(health.sources).length;
  const lastUpdate = health.updatedAt ? relativeTime(health.updatedAt) : null;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* ── HUD Bar ── */}
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-bg-primary px-4 py-2">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success pulse-dot" />
          <span className="text-[13px] font-bold uppercase tracking-[0.15em] text-text-bright">
            Sentinel
          </span>
          <span className="text-[10px] uppercase text-text-muted">v1.0</span>
        </div>

        {/* Divider */}
        <div className="hidden h-4 w-px bg-border sm:block" />

        {/* Source Filters */}
        <div className="flex items-center gap-1">
          {SOURCES.map((s) => (
            <button
              key={s.id ?? 'all'}
              onClick={() => handleSourceChange(s.id)}
              aria-pressed={activeSource === s.id}
              className={`filter-btn ${
                activeSource === s.id ? 'filter-btn-active' : 'filter-btn-inactive'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Time Filters */}
        <div className="flex items-center gap-1">
          {TIME_RANGES.map((t) => (
            <button
              key={t.id}
              onClick={() => handleRangeChange(t.id)}
              aria-pressed={activeRange === t.id}
              className={`filter-btn ${
                activeRange === t.id ? 'filter-btn-active' : 'filter-btn-inactive'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 sm:max-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search signals..."
            className="search-input w-full"
            aria-label="Search stories"
          />
        </div>

        {/* Stats */}
        <div className="ml-auto flex items-center gap-4 text-[10px] uppercase text-text-secondary">
          <span>
            <span className="text-text-bright">{totalSignals}</span> signals
          </span>
          <span>
            <span className="text-text-bright">{sourceCount}</span> src
          </span>
          {lastUpdate && (
            <span className="hidden md:inline">
              upd <span className="text-success">{lastUpdate}</span>
            </span>
          )}
        </div>
      </header>

      {/* ── Sector Grid ── */}
      <main className="tactical-bg scan-line flex-1 overflow-auto p-3">
        <div className="grid h-full auto-rows-fr grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {TOPICS.map((topic) => (
            <TopicSector
              key={topic.id}
              topic={topic}
              stories={categorized[topic.id] ?? []}
            />
          ))}
        </div>
      </main>

      {/* ── Status Bar ── */}
      <footer className="flex items-center justify-between border-t border-border bg-bg-primary px-4 py-1">
        <span className="text-[9px] uppercase tracking-[0.15em] text-text-muted">
          Sentinel Feed — Powered by Claude AI + Vercel
        </span>
        <span className="text-[9px] uppercase text-text-muted">
          auto-refresh 60s
        </span>
      </footer>
    </div>
  );
}
