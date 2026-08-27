'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Hospital } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function AdminTopbar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 md:px-8 backdrop-blur text-slate-900 dark:border-slate-800 dark:bg-slate-950/95">
      {/* Left side info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-teal-300 bg-teal-50 text-teal-800 text-xs font-mono">
            ADMIN CONSOLE
          </Badge>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Oxford University Hospitals NHS FT — Information Governance
          </span>
        </div>
      </div>

      {/* Right side status & portal switcher */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono">Audit Logging: ACTIVE</span>
        </div>

        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Clinician Portal</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
