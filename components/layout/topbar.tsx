'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Bell,
  Hospital,
  ChevronDown,
  Moon,
  Sun,
  Menu,
  LogOut,
  Sparkles,
  Mic,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePatients } from '@/hooks/use-patients';
import { signOut } from '@/lib/auth';
import { ClinicalSearchModal } from '@/components/ai/clinical-search-modal';
import { VoiceDictationModal } from '@/components/ai/voice-dictation-modal';

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAiSearchOpen, setIsAiSearchOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const { patients } = usePatients({ searchQuery: search });

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsAiSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    <>
      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 md:px-8 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        {/* Mobile Menu & Search Input */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Global Patient Search with AI Command Palette Trigger */}
          <div className="relative w-full">
            <div className="relative flex items-center">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search patients or press Cmd+K for AI Search..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setIsSearchOpen(e.target.value.length > 0);
                }}
                onFocus={() => {
                  if (search.length > 0) setIsSearchOpen(true);
                }}
                className="pl-9 pr-24 h-9 bg-slate-50/80 border-slate-200 focus:bg-white text-sm"
              />
              <button
                type="button"
                onClick={() => setIsAiSearchOpen(true)}
                className="absolute right-1.5 top-1.5 px-2 py-0.5 rounded-md bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/20 flex items-center gap-1 text-[11px] font-medium transition-colors"
                title="Open AI Semantic Search (Cmd+K)"
              >
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span className="hidden sm:inline">AI Search</span>
                <span className="font-mono text-[9px] opacity-70">⌘K</span>
              </button>
            </div>

            {/* Live Search Results Dropdown */}
            {isSearchOpen && (
              <div className="absolute left-0 right-0 top-11 z-50 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between p-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Matching Patients ({patients.length})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setIsAiSearchOpen(true);
                    }}
                    className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 text-[11px] normal-case"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Deep AI Search &rarr;</span>
                  </button>
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

          {/* Voice Dictation Trigger Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVoiceModalOpen(true)}
            className="gap-1.5 text-xs border-teal-500/30 text-teal-700 hover:bg-teal-50 dark:text-teal-300 dark:border-teal-800 dark:hover:bg-teal-950/30 shadow-sm"
            title="Voice Dictation for Theatre Operation Notes"
          >
            <Mic className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span className="hidden xl:inline">Voice Dictate</span>
          </Button>

          {/* AI Clinical Search Trigger Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAiSearchOpen(true)}
            className="gap-1.5 text-xs border-teal-500/30 text-teal-700 hover:bg-teal-50 dark:text-teal-300 dark:border-teal-800 dark:hover:bg-teal-950/30 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden sm:inline">AI Clinical Search</span>
          </Button>

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

      {/* Global AI Clinical Search Modal */}
      <ClinicalSearchModal
        isOpen={isAiSearchOpen}
        onClose={() => setIsAiSearchOpen(false)}
      />

      {/* Global AI Voice Dictation Modal */}
      <VoiceDictationModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </>
  );
}
