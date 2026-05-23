'use client';

import type { Story } from '@/lib/types';
import { TOPICS } from '@/lib/topics';
import { ACCENT_GREEN } from '@/lib/config';
import { StoryNode } from './story-node';

interface StoryListViewProps {
  readonly activeTopic: string | null;
  readonly onTopicChange: (topicId: string | null) => void;
  readonly totalCount: number;
  readonly topicCounts: Record<string, number>;
  readonly displayStories: readonly Story[];
  readonly getTopicColor: (story: Story) => string;
}

export function StoryListView({
  activeTopic,
  onTopicChange,
  totalCount,
  topicCounts,
  displayStories,
  getTopicColor,
}: StoryListViewProps) {
  return (
    <>
      {/* ── Topic Tabs ── */}
      <nav className="flex gap-0 overflow-x-auto border-b border-border bg-bg-primary px-3">
        <button
          onClick={() => onTopicChange(null)}
          className={`topic-tab ${!activeTopic ? 'topic-tab-active' : ''}`}
          style={{ '--tab-color': ACCENT_GREEN } as React.CSSProperties}
        >
          ALL
          <span className="ml-1.5 text-[10px] opacity-50">{totalCount}</span>
        </button>
        {TOPICS.map((topic) => (
          <button
            key={topic.id}
            onClick={() => onTopicChange(activeTopic === topic.id ? null : topic.id)}
            className={`topic-tab ${activeTopic === topic.id ? 'topic-tab-active' : ''}`}
            style={{ '--tab-color': topic.color } as React.CSSProperties}
          >
            {topic.label}
            <span className="ml-1.5 text-[10px] opacity-50">
              {topicCounts[topic.id] ?? 0}
            </span>
          </button>
        ))}
      </nav>

      {/* ── Story Feed ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl">
          {displayStories.length === 0 ? (
            <div className="px-5 py-16 text-center text-[12px] text-text-muted">
              No stories match the current filters.
            </div>
          ) : (
            displayStories.map((story) => (
              <StoryNode
                key={story.id}
                story={story}
                topicColor={getTopicColor(story)}
              />
            ))
          )}
        </div>
      </main>
    </>
  );
}
