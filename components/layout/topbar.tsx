'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Hospital,
  Menu,
  LogOut,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { usePatients } from '@/hooks/use-patients';
import { signOut } from '@/lib/auth';

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { patients } = usePatients({ searchQuery: search });

  const handleSelectPatient = (patientId: string) => {
    setIsSearchOpen(false);
    setSearch('');
    router.push(`/patients/${patientId}`);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 md:px-6 lg:px-8 backdrop-blur-md dark:border-[#272727] dark:bg-[#121212]/95">
      {/* Mobile Menu & Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-[#181818] focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:outline-none md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Global Patient Search */}
        <div className="relative w-full">
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
            <Input
              type="search"
              autoComplete="off"
              spellCheck={false}
              aria-label="Search patients by name, NHS number, or MRN"
              placeholder="Search patients by name, NHS number, or MRN…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsSearchOpen(e.target.value.length > 0);
              }}
              onFocus={() => {
                if (search.length > 0) setIsSearchOpen(true);
              }}
              className="pl-9 pr-4 h-9 bg-slate-50/90 border-slate-200 focus:bg-white text-xs sm:text-sm dark:bg-[#181818] dark:border-[#272727] focus-visible:ring-2 focus-visible:ring-teal-500/50"
            />
          </div>

          {/* Live Search Results Dropdown */}
          {isSearchOpen && (
            <div
              role="region"
              aria-label="Live patient search results"
              className="absolute left-0 right-0 top-11 z-50 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-[#272727] dark:bg-[#181818] max-h-96 overflow-y-auto"
            >
              <div className="flex items-center justify-between p-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <span>Matching Patients ({patients.length})</span>
              </div>
              {patients.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No patient matches found for &ldquo;{search}&rdquo;
                </div>
              ) : (
                <div className="space-y-1">
                  {patients.slice(0, 6).map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => handleSelectPatient(patient.id)}
                      className="flex w-full items-center justify-between rounded-lg p-2.5 text-left text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-[#1F1F1F] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 active:scale-[0.99]"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {patient.firstName} {patient.surname}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono [font-variant-numeric:tabular-nums]">NHS: {patient.nhsNumber}</span>
                          <span>•</span>
                          <span className="font-mono [font-variant-numeric:tabular-nums]">MRN: {patient.hospitalNumber}</span>
                          <span>•</span>
                          <span className="font-medium text-teal-600 dark:text-teal-400">Surgeon: {patient.primarySurgeon}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0 font-medium">
                        {patient.baseline?.clinicalStage ? `Stage ${patient.baseline.clinicalStage}` : 'Active'}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Header Items */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/80 text-xs font-medium text-slate-700 dark:bg-[#181818] dark:text-slate-300 border border-slate-200/60 dark:border-[#272727]">
          <Hospital className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
          <span>Oxford Urology Centre</span>
        </div>

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Quick New Patient */}
        <Link href="/patients/new">
          <Button size="sm" className="gap-1.5 shadow-sm text-xs font-bold">
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">New Patient</span>
          </Button>
        </Link>

        {/* Topbar Sign Out Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void handleSignOut()}
          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 gap-1.5 text-xs"
          title="Sign out of RALP Database"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden md:inline font-semibold">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}
