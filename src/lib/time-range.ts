import { HOUR_MS, DAY_MS } from './config';

export type TimeRange = '6h' | '12h' | '24h' | '7d';

export const TIME_RANGES: readonly { id: TimeRange; label: string }[] = [
  { id: '6h', label: '6H' },
  { id: '12h', label: '12H' },
  { id: '24h', label: '24H' },
  { id: '7d', label: '7D' },
];

/** How many days of stored feed a range needs (the API reads per-day blobs). */
export function timeRangeToDays(range: TimeRange): number {
  return range === '7d' ? 7 : 1;
}

export function timeRangeToMs(range: TimeRange): number {
  switch (range) {
    case '6h':
      return 6 * HOUR_MS;
    case '12h':
      return 12 * HOUR_MS;
    case '24h':
      return DAY_MS;
    case '7d':
      return 7 * DAY_MS;
  }
}
