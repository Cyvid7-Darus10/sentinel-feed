'use client';

import type { Story } from '@/lib/types';
import type { Topic } from '@/lib/topics';
import { TOPICS, categorizeStories } from '@/lib/topics';
import { formatScore } from '@/lib/sources';
import { relativeTime, isSafeUrl } from '@/lib/utils';
import { StoryTooltip } from '../molecules/story-tooltip';
import { Badge } from '../atoms/badge';
import { TopicDot } from '../atoms/topic-dot';
import { useMemo } from 'react';

interface SectorMapProps {
  readonly stories: readonly Story[];
  readonly onSelectTopic: (topicId: string) => void;
}

const SECTOR_VISIBLE = 4;

function Sector({
  topic,
  stories,
  onSelect,
}: {
  readonly topic: Topic;
  readonly stories: readonly Story[];
  readonly onSelect: () => void;
}) {
  const topStories = stories.slice(0, SECTOR_VISIBLE);
  const remaining = Math.max(0, stories.length - SECTOR_VISIBLE);

  return (
    <div
      className="sector-card group flex flex-col"
      style={{ '--sector-color': topic.color }}
    >
      <button
        onClick={onSelect}
        className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 text-left transition-colors hover:bg-bg-hover"
      >
        <span className="flex min-w-0 items-center gap-2">
          <TopicDot color={topic.color} />
          <span className="truncate text-[11px] font-bold tracking-wider text-text-bright">
            {topic.label}
          </span>
        </span>
        <span
          className="shrink-0 text-[15px] font-bold tabular-nums sm:text-[16px]"
          style={{ color: topic.color }}
        >
          {stories.length}
        </span>
      </button>

      <div
        className={`flex-1 overflow-hidden${remaining > 0 ? ' sector-feed' : ''}`}
      >
        {topStories.length === 0 ? (
          <p className="px-3 py-6 text-center text-[10px] text-text-muted">
            No stories in this sector
          </p>
        ) : (
          topStories.map((story) => {
            const score = formatScore(story.source, story.score);
            return (
              <div key={story.id} className="story-tooltip-wrap relative">
                <a
                  href={isSafeUrl(story.url) ? story.url : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 border-b border-border/50 px-3 py-2 transition-colors hover:bg-bg-hover"
                >
                  <Badge
                    sourceId={story.source}
                    className="mt-px hidden shrink-0 sm:inline"
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    {/* min-h reserves two lines (2 × leading-snug 1.375 × 12px)
                        so the meta row aligns across every story. */}
                    <span className="line-clamp-2 min-h-[2.75em] text-[12px] font-medium leading-snug text-text-bright">
                      {story.title}
                    </span>
                    <span className="flex items-center gap-2 text-[10px] text-text-muted">
                      <span>{relativeTime(story.publishedAt ?? story.fetchedAt)}</span>
                      {score && (
                        <span className="tabular-nums" style={{ color: topic.color }}>
                          {score}
                        </span>
                      )}
                    </span>
                  </span>
                </a>
                <StoryTooltip story={story} topicColor={topic.color} className="story-tooltip" />
              </div>
            );
          })
        )}
      </div>

      {stories.length > 0 && (
        <button
          onClick={onSelect}
          className="shrink-0 border-t border-border px-3 py-1.5 text-center text-[10px] text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary"
        >
          {remaining > 0 ? `+${remaining} more` : 'View all'}
        </button>
      )}
    </div>
  );
}

export function SectorMap({ stories, onSelectTopic }: SectorMapProps) {
  const categorized = useMemo(() => categorizeStories(stories), [stories]);

  return (
    <div className="sector-grid h-full overflow-y-auto p-0 sm:p-3">
      {TOPICS.map((topic) => (
        <Sector
          key={topic.id}
          topic={topic}
          stories={categorized[topic.id] ?? []}
          onSelect={() => onSelectTopic(topic.id)}
        />
      ))}
    </div>
  );
}
