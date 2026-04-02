import type { Story } from '@/lib/types';
import { getSourceConfig, formatScore } from '@/lib/sources';
import { relativeTime } from '@/lib/utils';

interface StoryNodeProps {
  readonly story: Story;
  readonly topicColor: string;
}

export function StoryNode({ story, topicColor }: StoryNodeProps) {
  const source = getSourceConfig(story.source);
  const scoreText = formatScore(story.source, story.score);
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
          <h3 className="text-[15px] font-medium leading-snug text-text-bright group-hover:text-white sm:text-[14px]">
            {story.title}
          </h3>
          {story.summary && (
            <p className="mt-1 text-[13px] leading-relaxed text-text-secondary sm:text-[12px]">
              {story.summary}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-text-muted sm:text-[11px]">
            <span className={`badge ${source.badgeClass}`}>{source.badge}</span>
            {story.author && <span>{story.author}</span>}
            <span>{relativeTime(displayTime)}</span>
            {story.tags.length > 0 && (
              <span style={{ color: topicColor }}>{story.tags.slice(0, 3).join(', ')}</span>
            )}
          </div>
        </div>
        {scoreText && (
          <span
            className="shrink-0 text-[13px] font-semibold tabular-nums"
            style={{ color: topicColor }}
          >
            {scoreText}
          </span>
        )}
      </div>
    </a>
  );
}
