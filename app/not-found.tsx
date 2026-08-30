import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HeartPulse, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-4">
        <HeartPulse className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900">404 — Record Not Found</h1>
      <p className="text-xs text-slate-500 mt-2 max-w-sm">
        The requested clinical page or patient record could not be found in the RALP database.
      </p>
      <Link href="/dashboard" className="mt-6">
        <Button className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Dashboard</span>
        </Button>
      </Link>
    </div>
  );
}
