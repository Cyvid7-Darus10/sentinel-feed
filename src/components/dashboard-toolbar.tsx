'use client';

import type { SourceId } from '@/lib/types';
import { SOURCE_FILTER_OPTIONS } from '@/lib/sources';
import { TIME_RANGES, type TimeRange } from '@/lib/time-range';

export type ViewMode = 'list' | 'map' | 'radar';

const VIEW_MODES: readonly { id: ViewMode; label: string; title: string }[] = [
  { id: 'radar', label: 'RADAR', title: 'Radar view' },
  { id: 'map', label: 'MAP', title: 'Sector map view' },
  { id: 'list', label: 'LIST', title: 'List view' },
];

interface DashboardToolbarProps {
  readonly viewMode: ViewMode;
  readonly onViewModeChange: (mode: ViewMode) => void;
  readonly searchQuery: string;
  readonly onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly activeSource: SourceId | null;
  readonly onSourceChange: (source: SourceId | null) => void;
  readonly activeRange: TimeRange;
  readonly onRangeChange: (range: TimeRange) => void;
  readonly storyCount: number;
  readonly sourceCount: number;
  readonly lastUpdate: string | null;
}

function filterBtnClass(active: boolean): string {
  return `filter-btn ${active ? 'filter-btn-active' : 'filter-btn-inactive'}`;
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

        <div className="flex items-center gap-1">
          {VIEW_MODES.map((v) => (
            <button
              key={v.id}
              onClick={() => onViewModeChange(v.id)}
              aria-pressed={viewMode === v.id}
              className={filterBtnClass(viewMode === v.id)}
              title={v.title}
            >
              {v.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search..."
          className="search-input hidden w-44 sm:block"
          aria-label="Search stories"
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
        <div className="flex shrink-0 items-center gap-1">
          {SOURCE_FILTER_OPTIONS.map((s) => (
            <button
              key={s.id ?? 'all'}
              onClick={() => onSourceChange(s.id)}
              aria-pressed={activeSource === s.id}
              className={filterBtnClass(activeSource === s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px shrink-0 bg-border" />

        <div className="flex shrink-0 items-center gap-1">
          {TIME_RANGES.map((t) => (
            <button
              key={t.id}
              onClick={() => onRangeChange(t.id)}
              aria-pressed={activeRange === t.id}
              className={filterBtnClass(activeRange === t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Mobile search (visible only on small screens) */}
        <input
          type="text"
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search..."
          className="search-input block w-36 shrink-0 sm:hidden"
          aria-label="Search stories"
        />
      </div>
    </header>
  );
}
