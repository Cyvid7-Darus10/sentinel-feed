'use client';

import { useEffect, useState } from 'react';
import type { Story, SourceHealth } from '@/lib/types';
import { API, REFRESH_INTERVAL_MS } from '@/lib/config';
import { type TimeRange, timeRangeToDays } from '@/lib/time-range';

interface StoryFeed {
  readonly stories: readonly Story[];
  readonly health: SourceHealth;
  readonly rateLimited: boolean;
  /** Wall-clock time of the latest tick; drives time-window filtering. */
  readonly now: number;
}

/**
 * Seeds from server-rendered data, then polls /api/stories and /api/sources
 * every REFRESH_INTERVAL_MS. `now` advances each tick so callers can filter by
 * time window without an impure Date.now() during render. A 429 from either
 * endpoint flips `rateLimited` and pauses updates until the next successful poll.
 */
export function useStoryFeed(
  initialStories: readonly Story[],
  initialHealth: SourceHealth,
  activeRange: TimeRange
): StoryFeed {
  const [stories, setStories] = useState<readonly Story[]>(initialStories);
  const [health, setHealth] = useState<SourceHealth>(initialHealth);
  const [rateLimited, setRateLimited] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // `cancelled` discards results from a tick that is still in flight when the
    // range changes (and the effect re-runs), so stale-range data can't land.
    let cancelled = false;
    const interval = setInterval(async () => {
      setNow(Date.now());
      try {
        const days = timeRangeToDays(activeRange);
        const [storiesRes, healthRes] = await Promise.all([
          fetch(API.stories(days)),
          fetch(API.sources),
        ]);
        if (cancelled) return;
        if (storiesRes.status === 429 || healthRes.status === 429) {
          setRateLimited(true);
          return;
        }
        setRateLimited(false);
        if (storiesRes.ok) {
          const data = await storiesRes.json();
          setStories(data.stories);
        }
        if (healthRes.ok) {
          const data = await healthRes.json();
          setHealth(data);
        }
      } catch {
        // next poll retries
      }
    }, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeRange]);

  return { stories, health, rateLimited, now };
}
