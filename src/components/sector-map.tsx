'use client';

import type { Story } from '@/lib/types';
import type { Topic } from '@/lib/topics';
import { TOPICS, categorizeStories } from '@/lib/topics';
import { getSourceConfig, formatScore } from '@/lib/sources';
import { relativeTime, isSafeUrl } from '@/lib/utils';
import { useMemo } from 'react';

interface SectorMapProps {
  readonly stories: readonly Story[];
  readonly onSelectTopic: (topicId: string) => void;
}

function Sector({
  topic,
  stories,
  onSelect,
}: {
  readonly topic: Topic;
  readonly stories: readonly Story[];
  readonly onSelect: () => void;
}) {
  const topStories = stories.slice(0, 5);
  const remaining = Math.max(0, stories.length - 5);

  return (
    <div
      className="sector-card group flex flex-col"
      style={{ '--sector-color': topic.color } as React.CSSProperties}
    >
      {/* Sector Header */}
      <button
        onClick={onSelect}
        className="flex items-center justify-between border-b border-border px-2 py-1.5 text-left transition-colors hover:bg-bg-hover sm:px-3 sm:py-2"
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2"
            style={{ background: topic.color }}
          />
          <span className="text-[10px] font-bold tracking-wider text-text-bright sm:text-[11px]">
            {topic.label}
          </span>
        </div>
        <span
          className="text-[14px] font-bold tabular-nums sm:text-[18px]"
          style={{ color: topic.color }}
        >
          {stories.length}
        </span>
      </button>

      {/* Story List */}
      <div className="flex-1 overflow-y-auto">
        {topStories.map((story) => {
          const src = getSourceConfig(story.source);
          const score = formatScore(story.source, story.score);
          return (
            <div key={story.id} className="story-tooltip-wrap relative">
              <a
                href={isSafeUrl(story.url) ? story.url : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 border-b border-border/50 px-2 py-1.5 transition-colors hover:bg-bg-hover sm:px-3 sm:py-2"
              >
                <span
                  className={`badge mt-0.5 hidden shrink-0 sm:inline ${src.badgeClass}`}
                >
                  {src.badge}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] leading-snug text-text-bright sm:text-[12px] sm:line-clamp-2 sm:whitespace-normal">
                    {story.title}
                  </p>
                  {story.summary && (
                    <p className="mt-0.5 hidden truncate text-[10px] leading-snug text-text-secondary sm:block">
                      {story.summary}
                    </p>
                  )}
                  <div className="mt-0.5 flex items-center gap-2 text-[10px] text-text-muted">
                    <span>{relativeTime(story.publishedAt ?? story.fetchedAt)}</span>
                    {score && (
                      <span style={{ color: topic.color }}>{score}</span>
                    )}
                  </div>
                </div>
              </a>
              {/* Tooltip */}
              <div className="story-tooltip" style={{ borderColor: topic.color }}>
                <p className="text-[13px] font-medium leading-snug text-text-bright">
                  {story.title}
                </p>
                {story.summary && (
                  <p className="mt-1.5 text-[12px] leading-relaxed text-text-secondary">
                    {story.summary}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted">
                  <span className={`badge ${src.badgeClass}`}>
                    {src.badge}
                  </span>
                  {story.author && <span>{story.author}</span>}
                  <span>{relativeTime(story.publishedAt ?? story.fetchedAt)}</span>
                  {score && (
                    <span className="font-semibold" style={{ color: topic.color }}>
                      {score}
                    </span>
                  )}
                </div>
                {story.tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {story.tags.slice(0, 5).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-medium"
                        style={{ color: topic.color }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {stories.length === 0 && (
          <div className="px-3 py-6 text-center text-[10px] text-text-muted">
            No stories in this sector
          </div>
        )}
      </div>

      {/* Overflow indicator */}
      {remaining > 0 && (
        <button
          onClick={onSelect}
          className="border-t border-border px-2 py-1 text-center text-[9px] text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary sm:px-3 sm:py-1.5 sm:text-[10px]"
        >
          +{remaining} more
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
