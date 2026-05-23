import type { Story } from '@/lib/types';
import { formatScore } from '@/lib/sources';
import { isSafeUrl } from '@/lib/utils';
import { StoryMeta } from './story-meta';

interface StoryNodeProps {
  readonly story: Story;
  readonly topicColor: string;
}

export function StoryNode({ story, topicColor }: StoryNodeProps) {
  const scoreText = formatScore(story.source, story.score);

  return (
    <a
      href={isSafeUrl(story.url) ? story.url : '#'}
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
          <StoryMeta
            story={story}
            topicColor={topicColor}
            className="mt-2 text-[12px] sm:text-[11px]"
          >
            {story.tags.length > 0 && (
              <span style={{ color: topicColor }}>
                {story.tags.slice(0, 3).join(', ')}
              </span>
            )}
          </StoryMeta>
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
