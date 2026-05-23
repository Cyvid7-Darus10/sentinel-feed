import type { Story } from '@/lib/types';
import { formatScore } from '@/lib/sources';
import { relativeTime } from '@/lib/utils';
import { Badge } from '../atoms/badge';

interface StoryMetaProps {
  readonly story: Story;
  readonly topicColor: string;
  readonly showScore?: boolean;
  readonly className?: string;
  readonly children?: React.ReactNode;
}

export function StoryMeta({
  story,
  topicColor,
  showScore = false,
  className,
  children,
}: StoryMetaProps) {
  const score = formatScore(story.source, story.score);
  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-text-muted${className ? ` ${className}` : ''}`}
    >
      <Badge sourceId={story.source} />
      {story.author && <span>{story.author}</span>}
      <span>{relativeTime(story.publishedAt ?? story.fetchedAt)}</span>
      {showScore && score && (
        <span className="font-semibold" style={{ color: topicColor }}>
          {score}
        </span>
      )}
      {children}
    </div>
  );
}
