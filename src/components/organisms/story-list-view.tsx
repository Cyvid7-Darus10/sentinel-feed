'use client';

import type { Story } from '@/lib/types';
import { TOPICS } from '@/lib/topics';
import { ACCENT_GREEN } from '@/lib/config';
import { Tab } from '../atoms/tab';
import { StoryNode } from '../molecules/story-node';

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
      <nav className="flex gap-0 overflow-x-auto border-b border-border bg-bg-primary px-3">
        <Tab active={!activeTopic} onClick={() => onTopicChange(null)} color={ACCENT_GREEN}>
          ALL
          <span className="ml-1.5 text-[10px] opacity-50">{totalCount}</span>
        </Tab>
        {TOPICS.map((topic) => (
          <Tab
            key={topic.id}
            active={activeTopic === topic.id}
            onClick={() => onTopicChange(activeTopic === topic.id ? null : topic.id)}
            color={topic.color}
          >
            {topic.label}
            <span className="ml-1.5 text-[10px] opacity-50">
              {topicCounts[topic.id] ?? 0}
            </span>
          </Tab>
        ))}
      </nav>

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
