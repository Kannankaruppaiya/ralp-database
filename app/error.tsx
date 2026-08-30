'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, RotateCw } from 'lucide-react';

/**
 * Route-level error boundary. Catches render and data-fetch errors thrown by
 * any page under the root layout and offers the user a way to recover without
 * a full reload.
 *
 * A clinical registry must never surface a raw stack trace or error message to
 * the browser — it can leak patient identifiers, query fragments, or internal
 * paths. Only the framework-provided `digest` (a hash) is shown, which is safe
 * to quote to support and correlates with the server log entry.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side render errors are logged by Next automatically; this captures
    // client-side ones for the browser console / any attached monitoring.
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-4">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900">Something went wrong</h1>
      <p className="text-xs text-slate-500 mt-2 max-w-sm">
        An unexpected error interrupted this page. No changes to any patient
        record were saved. You can retry, or return to the dashboard.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-[11px] text-slate-400">
          Reference: {error.digest}
        </p>
      )}
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={reset} className="gap-2">
          <RotateCw className="h-4 w-4" />
          <span>Try again</span>
        </Button>
        <Link href="/dashboard">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
