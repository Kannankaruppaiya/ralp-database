'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  GitCommit,
  Dna,
  Scissors,
  Microscope,
  ClipboardList,
  CalendarClock,
  FileText,
} from 'lucide-react';

interface PatientTabsProps {
  patientId: string;
}

export function PatientTabs({ patientId }: PatientTabsProps) {
  const pathname = usePathname();

  const tabs = [
    { label: 'Overview', href: `/patients/${patientId}`, icon: LayoutDashboard, exact: true },
    { label: 'Timeline', href: `/patients/${patientId}/timeline`, icon: GitCommit },
    { label: 'Baseline Cancer', href: `/patients/${patientId}/baseline`, icon: Dna },
    { label: 'Operation Record', href: `/patients/${patientId}/operation`, icon: Scissors },
    { label: 'Histology', href: `/patients/${patientId}/histology`, icon: Microscope },
    { label: 'PROMs (IPSS/SHIM)', href: `/patients/${patientId}/proms`, icon: ClipboardList },
    { label: 'Follow-ups', href: `/patients/${patientId}/follow-ups`, icon: CalendarClock },
    { label: 'Documents', href: `/patients/${patientId}/documents`, icon: FileText },
  ];

  return (
    <div className="border-b border-slate-200/80 dark:border-slate-800 mb-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <nav role="tablist" aria-label="Patient dossier tabs" className="flex space-x-1 min-w-max pb-px">
        {tabs.map((tab) => {
          const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              role="tab"
              aria-selected={isActive}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-t-lg',
                isActive
                  ? 'border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-300 font-bold bg-teal-50/40 dark:bg-teal-950/20'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
