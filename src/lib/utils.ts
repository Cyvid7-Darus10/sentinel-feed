export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function daysAgoKeys(days: number): readonly string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    keys.push(dateKey(d));
  }
  return keys;
}

export function relativeTime(isoDate: string): string {
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return 'unknown';
  const diffMs = Math.max(0, Date.now() - then);
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname}`.replace(/\/$/, '');
  } catch {
    return url;
  }
}
