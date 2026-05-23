'use client';

import { useSyncExternalStore } from 'react';

// localStorage-backed dismissal so the "Sentinel Bar" promo stays hidden across
// reloads. useSyncExternalStore reads this client-only state without a hydration
// mismatch or a setState-in-effect cascade.
const DISMISSED_KEY = 'sentinel-banner-dismissed';
const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  window.addEventListener('storage', callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', callback);
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
          <span className="ml-1 text-warning">Coming soon</span>
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
