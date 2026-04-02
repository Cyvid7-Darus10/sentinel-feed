import type { Story } from '@/lib/types';
import { relativeTime } from '@/lib/utils';

interface StoryNodeProps {
  readonly story: Story;
  readonly topicColor: string;
}

function sourceBadge(source: string): { label: string; className: string } {
  switch (source) {
    case 'hackernews':
      return { label: 'HN', className: 'badge-hn' };
    case 'github-trending':
      return { label: 'GH', className: 'badge-gh' };
    case 'lobsters':
      return { label: 'LO', className: 'badge-lo' };
    default:
      return { label: source.slice(0, 2).toUpperCase(), className: 'bg-info text-black' };
  }
}

function formatScore(story: Story): string | null {
  if (story.score === null || story.score === 0) return null;
  if (story.source === 'github-trending') return `${story.score.toLocaleString()} \u2605`;
  return `${story.score.toLocaleString()} pts`;
}

export function StoryNode({ story, topicColor }: StoryNodeProps) {
  const badge = sourceBadge(story.source);
  const scoreText = formatScore(story);
  const displayTime = story.publishedAt ?? story.fetchedAt;

  return (
    <a
      href={story.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block border-b border-border px-5 py-3.5 transition-colors hover:bg-bg-hover"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-medium leading-snug text-text-bright group-hover:text-white">
            {story.title}
          </h3>
          {story.summary && (
            <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">
              {story.summary}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted">
            <span className={`badge ${badge.className}`}>{badge.label}</span>
            {story.author && <span>{story.author}</span>}
            <span>{relativeTime(displayTime)}</span>
            {story.tags.length > 0 && (
              <span style={{ color: topicColor }}>{story.tags.slice(0, 3).join(', ')}</span>
            )}
          </div>
        </div>
        {scoreText && (
          <span
            className="shrink-0 text-[12px] font-semibold tabular-nums"
            style={{ color: topicColor }}
          >
            {scoreText}
          </span>
        )}
      </div>
    </a>
  );
}
