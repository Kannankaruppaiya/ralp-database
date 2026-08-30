'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CLINICIAN_NAVIGATION } from '@/config/navigation';
import { X, HeartPulse } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-card p-6 dark:bg-slate-900">
        <div className="flex items-center justify-between pb-6 border-b">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-primary" />
            <span className="font-bold text-foreground dark:text-white">RALP Registry</span>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="mt-6 space-y-1.5 overflow-y-auto">
          {CLINICIAN_NAVIGATION.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary dark:bg-teal-950 font-semibold'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
