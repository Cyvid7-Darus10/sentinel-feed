'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Story, SourceId, SourceHealth } from '@/lib/types';
import { StoryCard } from './story-card';
import { FeedControls } from './feed-controls';

type TimeRange = '6h' | '12h' | '24h' | '7d';

interface StoryFeedProps {
  readonly initialStories: readonly Story[];
  readonly initialHealth: SourceHealth;
}

function timeRangeToDays(range: TimeRange): number {
  switch (range) {
    case '6h':
    case '12h':
    case '24h':
      return 1;
    case '7d':
      return 7;
  }
}

function timeRangeToMs(range: TimeRange): number {
  switch (range) {
    case '6h':
      return 6 * 60 * 60 * 1000;
    case '12h':
      return 12 * 60 * 60 * 1000;
    case '24h':
      return 24 * 60 * 60 * 1000;
    case '7d':
      return 7 * 24 * 60 * 60 * 1000;
  }
}

export function StoryFeed({ initialStories, initialHealth }: StoryFeedProps) {
  const [stories, setStories] = useState<readonly Story[]>(initialStories);
  const [, setHealth] = useState<SourceHealth>(initialHealth);
  const [activeSource, setActiveSource] = useState<SourceId | null>(null);
  const [activeRange, setActiveRange] = useState<TimeRange>('24h');
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-refresh every 60 seconds
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
        // Silent fail — next poll will retry
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [activeRange]);

  const handleSourceChange = useCallback((source: SourceId | null) => {
    setActiveSource(source);
  }, []);

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setActiveRange(range);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const filtered = useMemo(() => {
    const now = Date.now();
    const rangeMs = timeRangeToMs(activeRange);
    const lowerQuery = searchQuery.toLowerCase();

    return stories.filter((story) => {
      // Source filter
      if (activeSource && story.source !== activeSource) return false;

      // Time range filter
      const storyTime = new Date(story.fetchedAt).getTime();
      if (now - storyTime > rangeMs) return false;

      // Search filter
      if (lowerQuery) {
        const haystack = `${story.title} ${story.summary ?? ''} ${story.author ?? ''} ${story.tags.join(' ')}`.toLowerCase();
        if (!haystack.includes(lowerQuery)) return false;
      }

      return true;
    });
  }, [stories, activeSource, activeRange, searchQuery]);

  return (
    <div className="flex flex-col gap-0">
      <FeedControls
        onSourceChange={handleSourceChange}
        onTimeRangeChange={handleTimeRangeChange}
        onSearchChange={handleSearchChange}
        activeSource={activeSource}
        activeRange={activeRange}
      />
      <div className="flex flex-col">
        {filtered.length === 0 ? (
          <div className="border border-t-0 border-border bg-bg-panel px-4 py-12 text-center">
            <p className="text-[11px] uppercase text-text-muted">
              No stories found. Waiting for fetch cycle.
            </p>
          </div>
        ) : (
          filtered.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))
        )}
      </div>
      <div className="border border-t-0 border-border bg-bg-primary px-3 py-1.5 text-center text-[10px] uppercase text-text-muted">
        {filtered.length} of {stories.length} stories — auto-refresh 60s
      </div>
    </div>
  );
}
