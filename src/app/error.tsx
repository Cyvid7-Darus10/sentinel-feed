'use client';

import { useEffect } from 'react';

/**
 * Segment-level boundary. The dashboard is `force-dynamic` and reads blob
 * storage on render, so a storage outage surfaces here rather than as a blank
 * document. Retry is worth offering because the usual cause is transient.
 */
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error('[render] Segment error:', error.digest ?? error.message);
  }, [error]);

  return (
    <main className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-[11px] uppercase tracking-[0.08em] text-danger">
        Signal lost
      </p>
      <h1 className="text-[20px] font-bold text-text-bright">
        The dashboard failed to render
      </h1>
      <p className="max-w-md text-[13px] leading-relaxed text-text-secondary">
        The feed could not be read. This is usually transient, so a retry is
        worth trying before anything else.
      </p>
      {error.digest && (
        <p className="text-[10px] uppercase tracking-[0.06em] text-text-muted">
          Ref {error.digest}
        </p>
      )}
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="mt-2 border border-border px-4 py-2 text-[11px] uppercase tracking-[0.08em] text-text-primary transition-colors duration-[120ms] hover:bg-bg-hover hover:text-text-bright"
      >
        Retry
      </button>
    </main>
  );
}
