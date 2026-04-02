import type { Story } from '@/lib/types';
import { getSourceConfig, formatScore } from '@/lib/sources';
import { relativeTime } from '@/lib/utils';

interface StoryTooltipProps {
  readonly story: Story;
  readonly topicColor: string;
  readonly className?: string;
}

/** Shared tooltip card used in the radar view and sector map. */
export function StoryTooltip({ story, topicColor, className }: StoryTooltipProps) {
  const src = getSourceConfig(story.source);
  const score = formatScore(story.source, story.score);

  return (
    <div className={className} style={{ borderColor: topicColor }}>
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
          <span className="font-semibold" style={{ color: topicColor }}>
            {score}
          </span>
        )}
      </div>
      {story.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {story.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="text-[10px] font-medium" style={{ color: topicColor }}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
