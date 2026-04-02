'use client';

import { useState, useCallback } from 'react';
import type { SourceId } from '@/lib/types';

type TimeRange = '6h' | '12h' | '24h' | '7d';

interface FeedControlsProps {
  readonly onSourceChange: (source: SourceId | null) => void;
  readonly onTimeRangeChange: (range: TimeRange) => void;
  readonly onSearchChange: (query: string) => void;
  readonly activeSource: SourceId | null;
  readonly activeRange: TimeRange;
}

const SOURCES: { id: SourceId | null; label: string }[] = [
  { id: null, label: 'ALL' },
  { id: 'hackernews', label: 'HN' },
  { id: 'github-trending', label: 'GH' },
];

const TIME_RANGES: { id: TimeRange; label: string }[] = [
  { id: '6h', label: '6H' },
  { id: '12h', label: '12H' },
  { id: '24h', label: '24H' },
  { id: '7d', label: '7D' },
];

export function FeedControls({
  onSourceChange,
  onTimeRangeChange,
  onSearchChange,
  activeSource,
  activeRange,
}: FeedControlsProps) {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);
      onSearchChange(value);
    },
    [onSearchChange]
  );

  return (
    <div className="flex flex-col gap-3 border border-border bg-bg-panel p-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Source Filters */}
      <div className="flex items-center gap-1">
        <span className="mr-2 text-[10px] uppercase text-text-muted">Src</span>
        {SOURCES.map((s) => (
          <button
            key={s.id ?? 'all'}
            onClick={() => onSourceChange(s.id)}
            aria-pressed={activeSource === s.id}
            className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              activeSource === s.id
                ? 'bg-text-bright text-bg-base'
                : 'bg-bg-hover text-text-secondary hover:text-text-bright'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Time Range */}
      <div className="flex items-center gap-1">
        <span className="mr-2 text-[10px] uppercase text-text-muted">Range</span>
        {TIME_RANGES.map((t) => (
          <button
            key={t.id}
            onClick={() => onTimeRangeChange(t.id)}
            aria-pressed={activeRange === t.id}
            className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              activeRange === t.id
                ? 'bg-text-bright text-bg-base'
                : 'bg-bg-hover text-text-secondary hover:text-text-bright'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <label htmlFor="story-search" className="text-[10px] uppercase text-text-muted">Find</label>
        <input
          id="story-search"
          type="text"
          value={searchValue}
          onChange={handleSearch}
          placeholder="search stories..."
          className="w-full border border-border bg-bg-base px-2 py-1 text-[11px] text-text-bright placeholder:text-text-muted focus:border-text-muted focus:outline-none sm:w-48"
        />
      </div>
    </div>
  );
}
