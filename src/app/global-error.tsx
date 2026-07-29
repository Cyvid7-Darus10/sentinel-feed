'use client';

import { useEffect } from 'react';

/**
 * Last-resort boundary for failures in the root layout itself. This file
 * replaces the layout when it renders, so globals.css and the font variable are
 * both gone — every style here has to be inline.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error('[render] Root error:', error.digest ?? error.message);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '0 1.5rem',
          textAlign: 'center',
          background: '#0a0a0c',
          color: '#b8b8c4',
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        <title>Signal lost | Sentinel Feed</title>
        <p
          style={{
            margin: 0,
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#f87171',
          }}
        >
          Signal lost
        </p>
        <h1 style={{ margin: 0, fontSize: '20px', color: '#eaeaf0' }}>
          Sentinel Feed failed to load
        </h1>
        <p style={{ margin: 0, maxWidth: '28rem', fontSize: '13px', lineHeight: 1.6 }}>
          Something went wrong before the dashboard could start.
        </p>
        {error.digest && (
          <p
            style={{
              margin: 0,
              fontSize: '10px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#48485a',
            }}
          >
            Ref {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={() => unstable_retry()}
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 1rem',
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontFamily: 'inherit',
            color: '#b8b8c4',
            background: 'transparent',
            border: '1px solid #26262e',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </body>
    </html>
  );
}
