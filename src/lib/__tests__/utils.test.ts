import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  todayKey,
  dateKey,
  daysAgoKeys,
  relativeTime,
  normalizeUrl,
} from '../utils';

describe('todayKey', () => {
  it('returns current date in YYYY-MM-DD format', () => {
    const result = todayKey();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('matches dateKey for today', () => {
    expect(todayKey()).toBe(dateKey(new Date()));
  });
});

describe('dateKey', () => {
  it('formats a specific date correctly', () => {
    const date = new Date('2026-04-01T15:30:00Z');
    expect(dateKey(date)).toBe('2026-04-01');
  });

  it('handles midnight UTC', () => {
    const date = new Date('2026-01-15T00:00:00Z');
    expect(dateKey(date)).toBe('2026-01-15');
  });

  it('handles end of day UTC', () => {
    const date = new Date('2026-12-31T23:59:59Z');
    expect(dateKey(date)).toBe('2026-12-31');
  });
});

describe('daysAgoKeys', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-05T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 1 key for days=1', () => {
    const keys = daysAgoKeys(1);
    expect(keys).toHaveLength(1);
    expect(keys[0]).toBe('2026-04-05');
  });

  it('returns 7 keys for days=7', () => {
    const keys = daysAgoKeys(7);
    expect(keys).toHaveLength(7);
    expect(keys[0]).toBe('2026-04-05');
    expect(keys[6]).toBe('2026-03-30');
  });

  it('returns empty array for days=0', () => {
    const keys = daysAgoKeys(0);
    expect(keys).toHaveLength(0);
  });

  it('keys are in descending date order', () => {
    const keys = daysAgoKeys(3);
    expect(keys).toEqual(['2026-04-05', '2026-04-04', '2026-04-03']);
  });
});

describe('relativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-05T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for current time', () => {
    expect(relativeTime('2026-04-05T12:00:00Z')).toBe('just now');
  });

  it('returns "just now" for 30 seconds ago', () => {
    expect(relativeTime('2026-04-05T11:59:30Z')).toBe('just now');
  });

  it('returns minutes for 1-59 minutes ago', () => {
    expect(relativeTime('2026-04-05T11:55:00Z')).toBe('5m ago');
    expect(relativeTime('2026-04-05T11:01:00Z')).toBe('59m ago');
  });

  it('returns hours for 1-23 hours ago', () => {
    expect(relativeTime('2026-04-05T11:00:00Z')).toBe('1h ago');
    expect(relativeTime('2026-04-05T00:00:00Z')).toBe('12h ago');
  });

  it('returns days for 24+ hours ago', () => {
    expect(relativeTime('2026-04-04T12:00:00Z')).toBe('1d ago');
    expect(relativeTime('2026-04-02T12:00:00Z')).toBe('3d ago');
  });
});

describe('normalizeUrl', () => {
  it('strips protocol and trailing slash', () => {
    expect(normalizeUrl('https://example.com/')).toBe('example.com');
  });

  it('preserves path', () => {
    expect(normalizeUrl('https://github.com/owner/repo')).toBe(
      'github.com/owner/repo'
    );
  });

  it('strips query parameters', () => {
    expect(normalizeUrl('https://example.com/page?foo=bar')).toBe(
      'example.com/page'
    );
  });

  it('strips fragment', () => {
    expect(normalizeUrl('https://example.com/page#section')).toBe(
      'example.com/page'
    );
  });

  it('returns input for invalid URLs', () => {
    expect(normalizeUrl('not-a-url')).toBe('not-a-url');
  });

  it('handles http and https the same', () => {
    const http = normalizeUrl('http://example.com/path');
    const https = normalizeUrl('https://example.com/path');
    expect(http).toBe(https);
  });

  it('preserves subdomain', () => {
    expect(normalizeUrl('https://blog.example.com/post')).toBe(
      'blog.example.com/post'
    );
  });
});
