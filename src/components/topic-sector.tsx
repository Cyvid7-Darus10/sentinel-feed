import type { Story } from '@/lib/types';
import type { Topic } from '@/lib/topics';
import { StoryNode } from './story-node';

interface TopicSectorProps {
  readonly topic: Topic;
  readonly stories: readonly Story[];
}

export function TopicSector({ topic, stories }: TopicSectorProps) {
  const maxScore = stories.reduce((m, s) => Math.max(m, s.score ?? 0), 0);

  return (
    <div
      className="sector min-h-0"
      style={{ '--sector-color': topic.color } as React.CSSProperties}
    >
      {/* Corner brackets */}
      <div className="corner-tl" />
      <div className="corner-tr" />
      <div className="corner-bl" />
      <div className="corner-br" />

      {/* Header */}
      <div className="relative z-[1] flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <div
            className="h-1.5 w-1.5 rounded-full pulse-dot"
            style={{ background: topic.color }}
          />
          <span
            className="text-[10px] font-bold uppercase tracking-[0.15em]"
            style={{ color: topic.color }}
          >
            {topic.label}
          </span>
        </div>
        <span className="text-[10px] font-bold tabular-nums text-text-muted">
          {stories.length}
        </span>
      </div>
      <div className="sector-header-line" />

      {/* Story list */}
      <div className="relative z-[1] flex-1 overflow-y-auto min-h-0">
        {stories.length === 0 ? (
          <div className="no-signal flex items-center justify-center px-3 py-8 text-[10px] uppercase tracking-[0.1em] text-text-muted">
            No signal
          </div>
        ) : (
          stories.map((story, i) => (
            <StoryNode
              key={story.id}
              story={story}
              index={i}
              maxScore={maxScore}
            />
          ))
        )}
      </div>
    </div>
  );
}
