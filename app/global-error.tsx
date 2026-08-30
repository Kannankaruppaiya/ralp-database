'use client';

import React, { useEffect } from 'react';

/**
 * Last-resort error boundary. `app/error.tsx` handles errors thrown inside the
 * root layout's children; this one catches errors in the root layout itself,
 * which is why it has to render its own <html> and <body> — the failing layout
 * can no longer provide them.
 *
 * Kept deliberately dependency-free (no shared UI, no fonts): if the layout
 * crashed, its providers may be unavailable, so this renders with inline styles
 * only. As with the route boundary, no raw error text reaches the browser.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Fatal application error:', error);
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
          background: '#f8fafc',
          color: '#0f172a',
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          textAlign: 'center',
          padding: '1rem',
        }}
      >
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>
          Service temporarily unavailable
        </h1>
        <p
          style={{
            fontSize: '0.8rem',
            color: '#64748b',
            marginTop: '0.5rem',
            maxWidth: '24rem',
          }}
        >
          The RALP Outcomes Platform hit an unexpected error and could not load.
          No patient data was affected. Please try again.
        </p>
        {error.digest && (
          <p
            style={{
              marginTop: '0.75rem',
              fontFamily: 'monospace',
              fontSize: '11px',
              color: '#94a3b8',
            }}
          >
            Reference: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: '1.5rem',
            height: '2.25rem',
            padding: '0 1.5rem',
            borderRadius: '0.375rem',
            border: 'none',
            background: '#0d9488',
            color: '#ffffff',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
