import type { Story } from '@/lib/types';
import { relativeTime } from '@/lib/utils';

interface StoryCardProps {
  readonly story: Story;
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

export function StoryCard({ story }: StoryCardProps) {
  const badge = sourceBadge(story.source);

  return (
    <a
      href={story.url}
      target="_blank"
      rel="noopener noreferrer"
      className="glow-hover block border border-border bg-bg-panel p-3 transition-colors hover:bg-bg-hover"
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 shrink-0 px-1.5 py-0.5 text-[9px] font-bold uppercase ${badge.className}`}
        >
          {badge.label}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-medium leading-tight text-text-bright">
            {story.title}
          </h3>
          {story.summary && (
            <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
              {story.summary}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3 text-[10px] uppercase text-text-muted">
            {story.score !== null && (
              <span>
                <span className="text-warning">{story.score}</span>{' '}
                {story.source === 'github-trending' ? 'stars today' : 'pts'}
              </span>
            )}
            {story.author && <span>by {story.author}</span>}
            <span>{relativeTime(story.fetchedAt)}</span>
            {story.tags.length > 0 && (
              <span className="text-info">{story.tags.join(', ')}</span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
