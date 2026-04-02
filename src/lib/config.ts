export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sentinel-feed.pastelero.ph';

// ── Centralized constants ──
// Keep magic values here so changes propagate everywhere.

/** Default fallback color when a topic has no color defined. */
export const DEFAULT_TOPIC_COLOR = '#94a3b8';

/** Color used for critical/security alerts. */
export const CRITICAL_COLOR = '#f87171';
export const CRITICAL_COLOR_LIGHT = '#fca5a5';

/** Primary accent green (sweep line, crosshair, active tab). */
export const ACCENT_GREEN = '#34d399';

/** Timeout applied to every outbound fetch in the fetcher pipeline. */
export const FETCHER_TIMEOUT_MS = 10_000;

/** How often the client polls for fresh stories (ms). */
export const REFRESH_INTERVAL_MS = 60_000;

/** How many days of blobs the cleanup cron keeps. */
export const RETENTION_DAYS = 7;

/** API route paths used by client-side fetches. */
export const API = {
  stories: (days: number) => `/api/stories?days=${days}`,
  sources: '/api/sources',
} as const;
