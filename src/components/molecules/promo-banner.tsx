'use client';

import { useSyncExternalStore } from 'react';
import { APP_STORE_URL } from '@/lib/config';

// Dismissal persisted in localStorage; useSyncExternalStore avoids a hydration mismatch.
const DISMISSED_KEY = 'sentinel-banner-dismissed';
const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  // Fire only for our key (storage fires for any key in other tabs; null = cleared).
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
          {' '}is the native macOS menu bar app. Tech news at a glance, without opening your browser.
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
