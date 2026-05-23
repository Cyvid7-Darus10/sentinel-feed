'use client';

import { useSyncExternalStore } from 'react';
import { APP_STORE_URL } from '@/lib/config';

// localStorage-backed dismissal so the "Sentinel Bar" promo stays hidden across
// reloads. useSyncExternalStore reads this client-only state without a hydration
// mismatch or a setState-in-effect cascade.
const DISMISSED_KEY = 'sentinel-banner-dismissed';
const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  // Only react to our key; `storage` fires for every key changed in other tabs.
  // A null key means localStorage was cleared, which also affects us.
  const handler = (e: StorageEvent) => {
    if (e.key === DISMISSED_KEY || e.key === null) callback();
  };
  window.addEventListener('storage', handler);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', handler);
  };
}

function getSnapshot(): boolean {
  return localStorage.getItem(DISMISSED_KEY) !== '1';
}

// Server render never shows the banner (no localStorage); the client snapshot
// takes over after hydration.
function getServerSnapshot(): boolean {
  return false;
}

function dismiss(): void {
  localStorage.setItem(DISMISSED_KEY, '1');
  listeners.forEach((listener) => listener());
}

export function PromoBanner() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!visible) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border bg-bg-panel px-4 py-2">
      <div className="flex items-center gap-3 text-[11px]">
        <span className="text-[13px]">&#x1F4E1;</span>
        <span className="text-text-secondary">
          <span className="font-semibold text-text-bright">Sentinel Bar</span>
          {' '}— native macOS menu bar app. Get tech news at a glance without opening your browser.
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 font-semibold text-success hover:underline"
          >
            Get it on the Mac App Store &rarr;
          </a>
        </span>
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 text-[11px] text-text-muted transition-colors hover:text-text-secondary"
        aria-label="Dismiss banner"
      >
        &#x2715;
      </button>
    </div>
  );
}
