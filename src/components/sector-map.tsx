import type { Story } from '@/lib/types';
import type { Topic } from '@/lib/topics';
import { TOPICS, categorizeTopic } from '@/lib/topics';
import { relativeTime } from '@/lib/utils';
import { useMemo } from 'react';

interface SectorMapProps {
  readonly stories: readonly Story[];
  readonly onSelectTopic: (topicId: string) => void;
}

function sourceBadgeClass(source: string): string {
  switch (source) {
    case 'hackernews':
      return 'badge-hn';
    case 'github-trending':
      return 'badge-gh';
    case 'lobsters':
      return 'badge-lo';
    case 'devto':
      return 'badge-dev';
    case 'reddit':
      return 'badge-rd';
    default:
      return 'bg-info text-black';
  }
}

function sourceBadgeLabel(source: string): string {
  switch (source) {
    case 'hackernews':
      return 'HN';
    case 'github-trending':
      return 'GH';
    case 'lobsters':
      return 'LO';
    case 'devto':
      return 'DEV';
    case 'reddit':
      return 'RD';
    default:
      return source.slice(0, 2).toUpperCase();
  }
}

function scoreLabel(story: Story): string | null {
  if (story.score === null || story.score === 0) return null;
  if (story.source === 'github-trending') return `${story.score.toLocaleString()}\u2605`;
  if (story.source === 'devto') return `${story.score.toLocaleString()}\u2764`;
  return `${story.score.toLocaleString()}`;
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
  const topStories = stories.slice(0, 8);
  const remaining = Math.max(0, stories.length - 8);

  return (
    <div
      className="sector-card group flex flex-col"
      style={{ '--sector-color': topic.color } as React.CSSProperties}
    >
      {/* Sector Header */}
      <button
        onClick={onSelect}
        className="flex items-center justify-between border-b border-border px-3 py-2 text-left transition-colors hover:bg-bg-hover"
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2"
            style={{ background: topic.color }}
          />
          <span className="text-[12px] font-bold tracking-wider text-text-bright sm:text-[11px]">
            {topic.label}
          </span>
        </div>
        <span
          className="text-[18px] font-bold tabular-nums"
          style={{ color: topic.color }}
        >
          {stories.length}
        </span>
      </button>

      {/* Story List */}
      <div className="flex-1 overflow-y-auto">
        {topStories.map((story) => {
          const score = scoreLabel(story);
          return (
            <a
              key={story.id}
              href={story.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 border-b border-border/50 px-3 py-2.5 transition-colors hover:bg-bg-hover sm:py-2"
            >
              <span
                className={`badge mt-0.5 shrink-0 ${sourceBadgeClass(story.source)}`}
              >
                {sourceBadgeLabel(story.source)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[13px] leading-snug text-text-bright sm:truncate sm:text-[12px]">
                  {story.title}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-text-muted sm:text-[10px]">
                  <span>{relativeTime(story.publishedAt ?? story.fetchedAt)}</span>
                  {score && (
                    <span style={{ color: topic.color }}>{score}</span>
                  )}
                </div>
              </div>
            </a>
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
          className="border-t border-border px-3 py-1.5 text-center text-[10px] text-text-muted transition-colors hover:bg-bg-hover hover:text-text-secondary"
        >
          +{remaining} more
        </button>
      )}
    </div>
  );
}

export function SectorMap({ stories, onSelectTopic }: SectorMapProps) {
  const categorized = useMemo(() => {
    const result: Record<string, Story[]> = {};
    for (const topic of TOPICS) {
      result[topic.id] = [];
    }
    for (const story of stories) {
      const topicId = categorizeTopic(story);
      result[topicId].push(story);
    }
    for (const topic of TOPICS) {
      result[topic.id].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    }
    return result;
  }, [stories]);

  return (
    <div className="sector-grid h-full overflow-y-auto p-3">
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
