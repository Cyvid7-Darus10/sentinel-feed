import { describe, it, expect } from 'vitest';
import { TIME_RANGES, timeRangeToDays, timeRangeToMs } from '../time-range';
import { HOUR_MS, DAY_MS } from '../config';

describe('timeRangeToDays', () => {
  it('maps 7d to 7 days', () => {
    expect(timeRangeToDays('7d')).toBe(7);
  });

  it.each(['6h', '12h', '24h'] as const)('maps %s to a single day', (range) => {
    expect(timeRangeToDays(range)).toBe(1);
  });
});

describe('timeRangeToMs', () => {
  it.each([
    ['6h', 6 * HOUR_MS],
    ['12h', 12 * HOUR_MS],
    ['24h', DAY_MS],
    ['7d', 7 * DAY_MS],
  ] as const)('maps %s to the matching duration', (range, expected) => {
    expect(timeRangeToMs(range)).toBe(expected);
  });
});

describe('TIME_RANGES', () => {
  it('lists every range in ascending order with labels', () => {
    expect(TIME_RANGES.map((t) => t.id)).toEqual(['6h', '12h', '24h', '7d']);
    expect(TIME_RANGES.map((t) => t.label)).toEqual(['6H', '12H', '24H', '7D']);
  });
});
