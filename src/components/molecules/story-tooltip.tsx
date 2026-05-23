import type { Story } from '@/lib/types';
import { StoryMeta } from './story-meta';

interface StoryTooltipProps {
  readonly story: Story;
  readonly topicColor: string;
  readonly className?: string;
}

/** Shared tooltip card used in the radar view and sector map. */
export function StoryTooltip({ story, topicColor, className }: StoryTooltipProps) {
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
      <StoryMeta
        story={story}
        topicColor={topicColor}
        showScore
        className="mt-2 text-[11px]"
      />
      {story.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {story.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium"
              style={{ color: topicColor }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
