export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sentinel-feed.pastelero.ph';

// Values that would otherwise be magic numbers scattered across the SVG and
// fetch code. Colors here are duplicated in globals.css because the radar needs
// them in JS to color dots inline; keep the two in sync.

/** Fallback for a topic with no color of its own. Matches --info. */
export const DEFAULT_TOPIC_COLOR = '#94a3b8';

/** Critical alerts. Same hex as the security topic and --danger, deliberately. */
export const CRITICAL_COLOR = '#f87171';
export const CRITICAL_COLOR_LIGHT = '#fca5a5';

/** Sweep line, crosshair, active tab. Matches --success. */
export const ACCENT_GREEN = '#34d399';

/** Per-request budget for every outbound fetcher call, via AbortSignal.timeout. */
export const FETCHER_TIMEOUT_MS = 10_000;

/** Client poll interval. Matches the s-maxage on the read routes, so most polls
 *  are served by the CDN rather than the origin. */
export const REFRESH_INTERVAL_MS = 60_000;

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

/** How far back cleanup keeps daily blobs, and the ceiling on ?days=. */
export const RETENTION_DAYS = 7;

export const API = {
  stories: (days: number) => `/api/stories?days=${days}`,
  sources: '/api/sources',
} as const;

/** CORS + edge-cache headers shared by the public read-only GET routes. */
export const PUBLIC_GET_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
} as const;

/** Mac App Store listing for the Sentinel Bar companion app. */
export const APP_STORE_URL =
  'https://apps.apple.com/app/sentinel-feed/id6761529644?mt=12';
