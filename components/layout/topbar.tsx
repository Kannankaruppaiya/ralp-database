'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Bell,
  Shield,
  Hospital,
  ChevronDown,
  Moon,
  Sun,
  Menu,
  LogOut,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePatients } from '@/hooks/use-patients';
import { SURGEON_OPTIONS } from '@/config/clinical-options';
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
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 md:px-8 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      {/* Mobile Menu & Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Patient Search Dropdown */}
        <div className="relative w-full">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search patient by name, NHS number, hospital MRN..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsSearchOpen(e.target.value.length > 0);
              }}
              onFocus={() => {
                if (search.length > 0) setIsSearchOpen(true);
              }}
              className="pl-9 pr-4 h-9 bg-slate-50/80 border-slate-200 focus:bg-white text-sm"
            />
          </div>

          {/* Live Search Results Modal */}
          {isSearchOpen && (
            <div className="absolute left-0 right-0 top-11 z-50 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 max-h-96 overflow-y-auto">
              <div className="p-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Matching Patients ({patients.length})
              </div>
              {patients.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">
                  No patient matches found for &ldquo;{search}&rdquo;
                </div>
              ) : (
                <div className="space-y-1">
                  {patients.slice(0, 6).map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => handleSelectPatient(patient.id)}
                      className="flex w-full items-center justify-between rounded-lg p-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {patient.firstName} {patient.surname}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span>NHS: {patient.nhsNumber}</span>
                          <span>•</span>
                          <span>MRN: {patient.hospitalNumber}</span>
                          <span>•</span>
                          <span className="font-medium text-teal-600">Surgeon: {patient.primarySurgeon}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[11px]">
                        {patient.baseline?.clinicalStage ? `Stage ${patient.baseline.clinicalStage}` : 'New'}
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
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Hospital className="h-3.5 w-3.5 text-teal-600" />
          <span>Oxford Urology Centre</span>
        </div>

        {/* Quick Admin Portal */}
        <Link href="/admin">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-900 dark:border-indigo-900 dark:text-indigo-300">
            <Shield className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Admin Console</span>
          </Button>
        </Link>

        {/* Quick New Patient */}
        <Link href="/patients/new">
          <Button size="sm" className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
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
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}
