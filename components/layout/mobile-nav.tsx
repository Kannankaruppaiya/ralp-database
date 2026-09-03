'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CLINICIAN_NAVIGATION } from '@/config/navigation';
import {
  X,
  HeartPulse,
  LayoutDashboard,
  Users,
  CalendarClock,
  FileUp,
  ClipboardCheck,
  FileText,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="h-4 w-4" aria-hidden="true" />,
  Users: <Users className="h-4 w-4" aria-hidden="true" />,
  CalendarClock: <CalendarClock className="h-4 w-4" aria-hidden="true" />,
  FileUp: <FileUp className="h-4 w-4" aria-hidden="true" />,
  ClipboardCheck: <ClipboardCheck className="h-4 w-4" aria-hidden="true" />,
  FileText: <FileText className="h-4 w-4" aria-hidden="true" />,
  BarChart3: <BarChart3 className="h-4 w-4" aria-hidden="true" />,
};

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
      className="fixed inset-0 z-50 flex md:hidden"
    >
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-white p-5 shadow-2xl dark:bg-[#121212] border-r border-slate-200 dark:border-[#272727] animate-in slide-in-from-left duration-300">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#272727]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm shadow-teal-600/20">
              <HeartPulse className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white text-sm leading-none block">RALP Registry</span>
              <span className="text-[10px] font-bold tracking-wider text-teal-600 dark:text-teal-400 uppercase">Surgical Database</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg dark:hover:bg-[#181818] dark:hover:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="mt-4 space-y-1 overflow-y-auto flex-1">
          {CLINICIAN_NAVIGATION.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
                  isActive
                    ? 'bg-teal-50 text-teal-900 dark:bg-[#181818] dark:text-teal-200 font-bold border-l-4 border-teal-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#181818] dark:hover:text-slate-100'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn('text-slate-400', isActive && 'text-teal-600 dark:text-teal-400')}>
                    {item.icon && ICON_MAP[item.icon]}
                  </span>
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <Badge variant="warning" className="h-4 px-1.5 text-[9px]">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-slate-100 dark:border-[#272727] text-xs text-slate-500 text-center">
          Oxford University Hospitals NHS Trust
        </div>
      </div>
    </div>
  );
}
