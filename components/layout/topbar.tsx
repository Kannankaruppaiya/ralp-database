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
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePatients } from '@/hooks/use-patients';
import { SURGEON_OPTIONS } from '@/config/clinical-options';

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

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border bg-card/95 px-4 md:px-8 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      {/* Mobile Menu & Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Patient Search Dropdown */}
        <div className="relative w-full">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
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
              className="pl-9 pr-4 h-9 bg-muted/80 border-border focus:bg-card text-sm"
            />
          </div>

          {/* Live Search Results Modal */}
          {isSearchOpen && (
            <div className="absolute left-0 right-0 top-11 z-50 rounded-xl border border-border bg-card p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 max-h-96 overflow-y-auto">
              <div className="p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Matching Patients ({patients.length})
              </div>
              {patients.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No patient matches found for &ldquo;{search}&rdquo;
                </div>
              ) : (
                <div className="space-y-1">
                  {patients.slice(0, 6).map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => handleSelectPatient(patient.id)}
                      className="flex w-full items-center justify-between rounded-lg p-2.5 text-left text-sm hover:bg-muted dark:hover:bg-slate-800 transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-foreground dark:text-slate-100">
                          {patient.firstName} {patient.surname}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>NHS: {patient.nhsNumber}</span>
                          <span>•</span>
                          <span>MRN: {patient.hospitalNumber}</span>
                          <span>•</span>
                          <span className="font-medium text-primary">Surgeon: {patient.primarySurgeon}</span>
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
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-md bg-muted text-xs text-muted-foreground dark:bg-slate-800 dark:text-slate-300">
          <Hospital className="h-3.5 w-3.5 text-primary" />
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
      </div>
    </header>
  );
}
