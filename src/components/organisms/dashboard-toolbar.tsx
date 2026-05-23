'use client';

import type { SourceId } from '@/lib/types';
import { SOURCE_FILTER_OPTIONS } from '@/lib/sources';
import { TIME_RANGES, type TimeRange } from '@/lib/time-range';
import { ViewToggle, type ViewMode } from '../molecules/view-toggle';
import { FilterGroup } from '../molecules/filter-group';
import { SearchInput } from '../atoms/search-input';

interface DashboardToolbarProps {
  readonly viewMode: ViewMode;
  readonly onViewModeChange: (mode: ViewMode) => void;
  readonly searchQuery: string;
  readonly onSearchChange: (value: string) => void;
  readonly activeSource: SourceId | null;
  readonly onSourceChange: (source: SourceId | null) => void;
  readonly activeRange: TimeRange;
  readonly onRangeChange: (range: TimeRange) => void;
  readonly storyCount: number;
  readonly sourceCount: number;
  readonly lastUpdate: string | null;
}

export function DashboardToolbar({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  activeSource,
  onSourceChange,
  activeRange,
  onRangeChange,
  storyCount,
  sourceCount,
  lastUpdate,
}: DashboardToolbarProps) {
  return (
    <header className="border-b border-border bg-bg-primary">
      {/* Top row: brand + view toggle + search + stats */}
      <div className="flex items-center gap-x-4 px-4 py-2">
        <span className="shrink-0 text-[14px] font-bold uppercase tracking-[0.1em] text-text-bright">
          Sentinel
        </span>

        <div className="hidden h-4 w-px bg-border sm:block" />

        <ViewToggle value={viewMode} onChange={onViewModeChange} />

        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          className="hidden w-44 sm:block"
        />

        <div className="ml-auto flex shrink-0 items-center gap-3 text-[11px] text-text-secondary">
          <span>
            <span className="text-text-bright">{storyCount}</span> stories
          </span>
          <span className="hidden sm:inline">
            <span className="text-text-bright">{sourceCount}</span> sources
          </span>
          {lastUpdate && (
            <span className="hidden lg:inline">
              updated <span className="text-success">{lastUpdate}</span>
            </span>
          )}
        </div>
      </div>

      {/* Bottom row: filters (scrollable on mobile) */}
      <div className="flex items-center gap-3 overflow-x-auto px-4 pb-2">
        <FilterGroup
          options={SOURCE_FILTER_OPTIONS}
          value={activeSource}
          onChange={onSourceChange}
        />

        <div className="h-4 w-px shrink-0 bg-border" />

        <FilterGroup
          options={TIME_RANGES}
          value={activeRange}
          onChange={onRangeChange}
        />

        {/* Mobile search (visible only on small screens) */}
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          className="block w-36 shrink-0 sm:hidden"
        />
      </div>
    </header>
  );
}
