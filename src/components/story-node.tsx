import type { Story } from '@/lib/types';
import { relativeTime } from '@/lib/utils';

interface StoryNodeProps {
  readonly story: Story;
  readonly index: number;
  readonly maxScore: number;
}

function sourceBadge(source: string): { label: string; className: string } {
  switch (source) {
    case 'hackernews':
      return { label: 'HN', className: 'badge-hn' };
    case 'github-trending':
      return { label: 'GH', className: 'badge-gh' };
    default:
      return { label: source.slice(0, 2).toUpperCase(), className: 'bg-info text-black' };
  }
}

export function StoryNode({ story, index, maxScore }: StoryNodeProps) {
  const badge = sourceBadge(story.source);
  const score = story.score ?? 0;
  const barWidth = maxScore > 0 ? Math.max(4, (score / maxScore) * 100) : 0;
  const displayTime = story.publishedAt ?? story.fetchedAt;

  return (
    <a
      href={story.url}
      target="_blank"
      rel="noopener noreferrer"
      className="story-node"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 text-[11px] font-medium leading-snug text-text-bright">
          {story.title}
        </h3>
        {score > 0 && (
          <span className="score-pip shrink-0" style={{ color: 'var(--sector-color)' }}>
            {score}
            <span className="text-[8px] opacity-60">
              {story.source === 'github-trending' ? '\u2605' : '\u25B2'}
            </span>
          </span>
        )}
      </div>

      {story.summary && (
        <p className="mt-1 line-clamp-1 text-[10px] leading-relaxed text-text-secondary">
          {story.summary}
        </p>
      )}

      <div className="mt-1.5 flex items-center gap-2 text-[9px] uppercase text-text-muted">
        <span className={`px-1 py-px text-[8px] font-bold ${badge.className}`}>
          {badge.label}
        </span>
        {story.author && (
          <span className="truncate max-w-[80px]">{story.author}</span>
        )}
        <span>{relativeTime(displayTime)}</span>
        {story.tags.length > 0 && (
          <span className="hidden truncate text-text-secondary sm:inline">
            {story.tags.slice(0, 2).join(', ')}
          </span>
        )}
      </div>

      {score > 0 && (
        <div
          className="score-bar"
          style={{ width: `${barWidth}%` }}
        />
      )}
    </a>
  );
}
