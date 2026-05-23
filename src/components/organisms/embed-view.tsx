'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Story } from '@/lib/types';
import { TOPICS, categorizeTopic } from '@/lib/topics';
import { formatScore } from '@/lib/sources';
import { isCritical } from '@/lib/classification';
import { DEFAULT_TOPIC_COLOR, CRITICAL_COLOR, API, DAY_MS } from '@/lib/config';
import { relativeTime, isSafeUrl } from '@/lib/utils';
import { Badge } from '../atoms/badge';
import { TopicDot } from '../atoms/topic-dot';

interface EmbedViewProps {
  readonly initialStories: readonly Story[];
}

function CompactStory({ story }: { readonly story: Story }) {
  const score = formatScore(story.source, story.score);
  const critical = isCritical(story);
  const topicId = categorizeTopic(story);
  const topicColor = TOPICS.find((t) => t.id === topicId)?.color ?? DEFAULT_TOPIC_COLOR;

  return (
    <a
      href={isSafeUrl(story.url) ? story.url : '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-2 border-b border-border px-3 py-2.5 transition-colors hover:bg-bg-hover"
    >
      <Badge sourceId={story.source} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p
          className="text-[12px] font-medium leading-snug text-text-bright"
          style={critical ? { color: CRITICAL_COLOR } : undefined}
        >
          {critical && <span className="mr-1">!!</span>}
          {story.title}
        </p>
        {story.summary && (
          <p className="mt-0.5 truncate text-[10px] leading-snug text-text-secondary">
            {story.summary}
          </p>
        )}
        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-text-muted">
          <span>{relativeTime(story.publishedAt ?? story.fetchedAt)}</span>
          {score && <span style={{ color: topicColor }}>{score}</span>}
        </div>
      </div>
    </a>
  );
}

export function EmbedView({ initialStories }: EmbedViewProps) {
  const [stories, setStories] = useState<readonly Story[]>(initialStories);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  // `now` drives the 24h window; kept in state so the filter stays pure.
  const [now, setNow] = useState(() => Date.now());

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(async () => {
      setNow(Date.now());
      try {
        const res = await fetch(API.stories(1));
        if (res.ok) {
          const data = await res.json();
          setStories(data.stories);
        }
      } catch {
        // next poll retries
      }
    }, 120_000);
    return () => clearInterval(interval);
  }, []);

  // Filter to last 24h
  const recent = useMemo(() => {
    const cutoff = now - DAY_MS;
    return stories.filter((s) => {
      const t = new Date(s.publishedAt ?? s.fetchedAt).getTime();
      return t > cutoff;
    });
  }, [stories, now]);

  // Topic counts
  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const topic of TOPICS) counts[topic.id] = 0;
    for (const story of recent) counts[categorizeTopic(story)]++;
    return counts;
  }, [recent]);

  // Filtered stories
  const display = useMemo(() => {
    if (!activeTopic) return recent;
    return recent.filter((s) => categorizeTopic(s) === activeTopic);
  }, [recent, activeTopic]);

  const criticalCount = useMemo(
    () => recent.filter(isCritical).length,
    [recent]
  );

  const handleTopicClick = useCallback((topicId: string) => {
    setActiveTopic((prev) => (prev === topicId ? null : topicId));
  }, []);

  return (
    <div className="flex h-screen flex-col bg-bg-base text-text-primary">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-3 py-2">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-bright hover:text-white"
        >
          Sentinel
        </a>
        <div className="flex items-center gap-2 text-[10px] text-text-muted">
          <span className="text-text-bright">{recent.length}</span> stories
          {criticalCount > 0 && (
            <span className="font-semibold text-danger">
              {criticalCount} critical
            </span>
          )}
        </div>
      </header>

      {/* Topic pills */}
      <div className="flex gap-0 overflow-x-auto border-b border-border">
        <button
          onClick={() => setActiveTopic(null)}
          className={`embed-pill ${!activeTopic ? 'embed-pill-active' : ''}`}
        >
          ALL <span className="opacity-50">{recent.length}</span>
        </button>
        {TOPICS.map((topic) => (
          <button
            key={topic.id}
            onClick={() => handleTopicClick(topic.id)}
            className={`embed-pill ${activeTopic === topic.id ? 'embed-pill-active' : ''}`}
            style={
              activeTopic === topic.id
                ? { '--pill-color': topic.color }
                : undefined
            }
          >
            <TopicDot color={topic.color} className="h-1.5 w-1.5 rounded-full" />
            {topicCounts[topic.id] ?? 0}
          </button>
        ))}
      </div>

      {/* Stories */}
      <main className="flex-1 overflow-y-auto">
        {display.length === 0 ? (
          <div className="px-3 py-12 text-center text-[11px] text-text-muted">
            No stories match the current filter.
          </div>
        ) : (
          display.map((story) => (
            <CompactStory key={story.id} story={story} />
          ))
        )}
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-between border-t border-border px-3 py-1">
        <span className="text-[9px] text-text-muted">
          auto-refresh 2m
        </span>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] text-text-muted hover:text-text-secondary"
        >
          Open full dashboard
        </a>
      </footer>
    </div>
  );
}
