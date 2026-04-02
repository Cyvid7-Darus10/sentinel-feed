import { describe, it, expect } from 'vitest';
import {
  VALID_SOURCE_SET,
  SOURCE_FILTER_OPTIONS,
  getSourceConfig,
  getSourceDisplayName,
  formatScore,
} from '../sources';

describe('VALID_SOURCE_SET', () => {
  it('contains all known source IDs', () => {
    expect(VALID_SOURCE_SET.has('hackernews')).toBe(true);
    expect(VALID_SOURCE_SET.has('github-trending')).toBe(true);
    expect(VALID_SOURCE_SET.has('lobsters')).toBe(true);
    expect(VALID_SOURCE_SET.has('devto')).toBe(true);
  });

  it('rejects unknown source IDs', () => {
    expect(VALID_SOURCE_SET.has('reddit')).toBe(false);
    expect(VALID_SOURCE_SET.has('')).toBe(false);
  });
});

describe('SOURCE_FILTER_OPTIONS', () => {
  it('starts with ALL option (null id)', () => {
    expect(SOURCE_FILTER_OPTIONS[0]).toEqual({ id: null, label: 'ALL' });
  });

  it('includes badge labels for each source', () => {
    const labels = SOURCE_FILTER_OPTIONS.map((o) => o.label);
    expect(labels).toContain('HN');
    expect(labels).toContain('GH');
    expect(labels).toContain('LO');
    expect(labels).toContain('DEV');
  });
});

describe('getSourceConfig', () => {
  it('returns config for known source', () => {
    const config = getSourceConfig('hackernews');
    expect(config.id).toBe('hackernews');
    expect(config.name).toBe('Hacker News');
    expect(config.badge).toBe('HN');
    expect(config.scoreUnit).toBe('pts');
  });

  it('returns fallback config for unknown source', () => {
    const config = getSourceConfig('unknown-source');
    expect(config.id).toBe('unknown-source');
    expect(config.name).toBe('unknown-source');
    expect(config.badge).toBe('UN');
    expect(config.scoreUnit).toBe('pts');
  });

  it('returns correct config for github-trending', () => {
    const config = getSourceConfig('github-trending');
    expect(config.name).toBe('GitHub Trending');
    expect(config.badge).toBe('GH');
    expect(config.scoreUnit).toBe('★');
  });
});

describe('getSourceDisplayName', () => {
  it('returns display name for known source', () => {
    expect(getSourceDisplayName('hackernews')).toBe('Hacker News');
    expect(getSourceDisplayName('devto')).toBe('Dev.to');
  });

  it('returns raw ID for unknown source', () => {
    expect(getSourceDisplayName('foo')).toBe('foo');
  });
});

describe('formatScore', () => {
  it('formats score with source unit', () => {
    expect(formatScore('hackernews', 1234)).toBe('1,234 pts');
    expect(formatScore('github-trending', 500)).toBe('500 ★');
    expect(formatScore('devto', 42)).toBe('42 ❤');
  });

  it('returns null for null score', () => {
    expect(formatScore('hackernews', null)).toBeNull();
  });

  it('returns null for zero score', () => {
    expect(formatScore('hackernews', 0)).toBeNull();
  });

  it('formats score for unknown source with default unit', () => {
    expect(formatScore('unknown', 10)).toBe('10 pts');
  });
});
