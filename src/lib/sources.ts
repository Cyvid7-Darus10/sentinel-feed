import type { SourceId } from './types';

interface SourceConfig {
  readonly id: SourceId;
  readonly name: string;
  readonly badge: string;
  readonly badgeClass: string;
  readonly scoreUnit: string;
}

const SOURCE_CONFIGS: readonly SourceConfig[] = [
  { id: 'hackernews', name: 'Hacker News', badge: 'HN', badgeClass: 'badge-hn', scoreUnit: 'pts' },
  { id: 'github-trending', name: 'GitHub Trending', badge: 'GH', badgeClass: 'badge-gh', scoreUnit: '\u2605' },
  { id: 'lobsters', name: 'Lobsters', badge: 'LO', badgeClass: 'badge-lo', scoreUnit: 'pts' },
  { id: 'devto', name: 'Dev.to', badge: 'DEV', badgeClass: 'badge-dev', scoreUnit: '\u2764' },
  { id: 'dailydev', name: 'daily.dev', badge: 'DD', badgeClass: 'badge-dd', scoreUnit: 'pts' },
] as const;

const SOURCE_MAP = new Map<string, SourceConfig>(
  SOURCE_CONFIGS.map((s) => [s.id, s])
);

const ALL_SOURCE_IDS: readonly SourceId[] = SOURCE_CONFIGS.map((s) => s.id);

export const VALID_SOURCE_SET: ReadonlySet<string> = new Set(ALL_SOURCE_IDS);

export const SOURCE_FILTER_OPTIONS: readonly { id: SourceId | null; label: string }[] = [
  { id: null, label: 'ALL' },
  ...SOURCE_CONFIGS.map((s) => ({ id: s.id, label: s.badge })),
];

export function getSourceConfig(sourceId: string): SourceConfig {
  return SOURCE_MAP.get(sourceId) ?? {
    id: sourceId as SourceId,
    name: sourceId,
    badge: sourceId.slice(0, 2).toUpperCase(),
    badgeClass: 'bg-info text-black',
    scoreUnit: 'pts',
  };
}

export function getSourceDisplayName(sourceId: string): string {
  return getSourceConfig(sourceId).name;
}

export function formatScore(sourceId: string, score: number | null): string | null {
  if (score === null || score === 0) return null;
  const { scoreUnit } = getSourceConfig(sourceId);
  return `${score.toLocaleString()} ${scoreUnit}`;
}
