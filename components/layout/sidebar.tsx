'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  FileUp,
  ClipboardCheck,
  FileText,
  BarChart3,
  HeartPulse,
  LogOut,
  Sparkles,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CLINICIAN_NAVIGATION } from '@/config/navigation';
import { Badge } from '@/components/ui/badge';
import { useSession, signOut } from '@/lib/auth';
import { ClinicalSearchModal } from '@/components/ai/clinical-search-modal';

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="h-4 w-4" aria-hidden="true" />,
  Users: <Users className="h-4 w-4" aria-hidden="true" />,
  CalendarClock: <CalendarClock className="h-4 w-4" aria-hidden="true" />,
  FileUp: <FileUp className="h-4 w-4" aria-hidden="true" />,
  ClipboardCheck: <ClipboardCheck className="h-4 w-4" aria-hidden="true" />,
  FileText: <FileText className="h-4 w-4" aria-hidden="true" />,
  BarChart3: <BarChart3 className="h-4 w-4" aria-hidden="true" />,
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSession();
  const [isAiSearchOpen, setIsAiSearchOpen] = useState(false);

  // Global Cmd+K / Ctrl+K listener to open AI search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsAiSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'NHS';

  return (
    <>
      <aside
        aria-label="Clinician Portal Sidebar"
        className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/80 bg-white dark:border-[#272727] dark:bg-[#121212] md:flex"
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-5 dark:border-[#272727]">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm shadow-teal-600/20 group-hover:bg-teal-700 transition-colors duration-200">
              <HeartPulse className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white text-sm leading-none block">
                RALP Registry
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-teal-600 dark:text-teal-400 uppercase">
                Surgical Database v2
              </span>
            </div>
          </Link>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800">
            NHS
          </span>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
          {/* Quick AI Search Trigger Card */}
          <button
            type="button"
            onClick={() => setIsAiSearchOpen(true)}
            aria-label="Open AI Clinical Search (Command + K)"
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-teal-50/50 dark:bg-[#181818] border border-teal-500/20 hover:border-teal-500/40 text-teal-900 dark:text-teal-200 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] text-xs font-semibold group shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500 group-hover:rotate-12 transition-transform duration-300" aria-hidden="true" />
              <span>AI Clinical Search</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#272727] border border-teal-500/30 text-[10px] font-mono text-teal-700 dark:text-teal-300">
              ⌘K
            </kbd>
          </button>

          <div>
            <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Clinical Registry
            </p>
            <nav className="space-y-1">
              {CLINICIAN_NAVIGATION.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500',
                      isActive
                        ? 'bg-teal-50 text-teal-900 dark:bg-[#181818] dark:text-teal-300 border-l-2 border-teal-600 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#181818] dark:hover:text-slate-100'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          'text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors duration-200',
                          isActive && 'text-teal-600 dark:text-teal-400'
                        )}
                      >
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
          </div>

          {/* Quick link to Admin Portal if user is administrator or consultant */}
          {(user?.role === 'Consultant Surgeon' || user?.role === 'Data Manager') && (
            <div className="pt-2 border-t border-slate-100 dark:border-[#272727]">
              <Link
                href="/admin"
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-[#181818] dark:hover:text-slate-200 rounded-lg transition-colors duration-200"
              >
                <Shield className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />
                <span>Admin Governance Console</span>
              </Link>
            </div>
          )}
        </div>

        {/* User Session Footer with Sign Out */}
        <div className="border-t border-slate-200/80 p-3 dark:border-[#272727] bg-slate-50/50 dark:bg-[#181818]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-600 font-bold text-xs text-white shadow-sm">
                {initials}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                  {user?.name || 'Signed In Clinician'}
                </p>
                <p className="truncate text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span>{user?.role || 'Clinician'}</span>
                  {user?.surgeonCode && (
                    <span className="font-bold text-teal-600 dark:text-teal-400">({user.surgeonCode})</span>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleSignOut()}
              aria-label="Sign out"
              className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 shrink-0"
              title="Sign out of RALP Database"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      {/* Global AI Clinical Search Modal */}
      <ClinicalSearchModal
        isOpen={isAiSearchOpen}
        onClose={() => setIsAiSearchOpen(false)}
      />
    </>
  );
}
