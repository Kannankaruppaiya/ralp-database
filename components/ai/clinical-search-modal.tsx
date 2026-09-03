'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Sparkles,
  X,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Activity,
  FileText,
  User,
  ShieldAlert,
  Calendar,
  Layers,
  ChevronRight,
  Stethoscope,
  Command,
  Zap,
  Clock,
  Dna,
  HeartPulse,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePatients } from '@/hooks/use-patients';
import { ClinicalSearchEngine, SearchResponse } from '@/lib/ai/search-engine';
import { synthesizeClinicalRAG, RAGSynthesisOutput } from '@/lib/ai/rag-synthesizer';
import { formatNhsNumber, formatDate, formatPsa } from '@/lib/formatters';

interface ClinicalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TEMPLATE_CATEGORIES = [
  {
    category: 'Oncology & Pathology',
    icon: Dna,
    queries: [
      'pT3b stage with positive surgical margins',
      'Gleason 4+5 (Grade Group 5) high risk',
      'Positive margins (R1) at bladder neck or apex',
    ],
  },
  {
    category: 'Biochemical & Surveillance',
    icon: Activity,
    queries: [
      'PSA > 10 ng/mL and Gleason 4+3',
      'Biochemical recurrence (PSA >= 0.2) alerts',
      'Overdue milestone follow-ups',
    ],
  },
  {
    category: 'Operative & PROMs Outcomes',
    icon: HeartPulse,
    queries: [
      'Surgeon VK cases with bilateral nerve sparing',
      'Pad-free continence at 12m follow-up',
      'Surgeon RDM cases with pT2 stage',
    ],
  },
];

export function ClinicalSearchModal({ isOpen, onClose }: ClinicalSearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'cohort' | 'rag'>('cohort');

  // Load all patients to feed the search engine
  const { allPatients, isLoading: isPatientsLoading } = usePatients({ fetchAll: true });

  // Initialize and memoize search engine
  const engine = useMemo(() => {
    return new ClinicalSearchEngine(allPatients);
  }, [allPatients]);

  // Execute Search
  const searchResponse: SearchResponse = useMemo(() => {
    if (!query.trim()) {
      return {
        query: '',
        parsedQuery: { rawQuery: '', keywords: [], extractedIntents: [] },
        totalMatches: 0,
        results: [],
        executionTimeMs: 0,
      };
    }
    return engine.search(query, 30);
  }, [engine, query]);

  // Synthesize RAG
  const ragOutput: RAGSynthesisOutput = useMemo(() => {
    return synthesizeClinicalRAG(searchResponse);
  }, [searchResponse]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global ESC listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectPatient = (patientId: string) => {
    onClose();
    router.push(`/patients/${patientId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 md:p-10 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Double-Bezel Outer Glow Shell */}
      <div className="relative w-full max-w-4xl rounded-[1.75rem] p-1.5 bg-gradient-to-b from-white/20 via-white/5 to-teal-500/10 shadow-[0_0_80px_-20px_rgba(20,184,166,0.35),0_25px_50px_-12px_rgba(0,0,0,0.85)] border border-white/10 overflow-hidden">
        
        {/* Inner Solid Command Container */}
        <div className="rounded-[calc(1.75rem-0.375rem)] bg-slate-950 border border-slate-800/90 overflow-hidden flex flex-col max-h-[82vh] text-slate-100 shadow-inner">
          
          {/* HEADER / SEARCH INPUT BAR */}
          <div className="relative p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur flex items-center gap-3.5">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border border-teal-500/30 text-teal-300 shadow-inner">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <div className="absolute inset-0 rounded-xl bg-teal-400/10 blur-sm pointer-events-none" />
            </div>

            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask clinical queries e.g. pT3b positive margins under Surgeon VK with PSA > 10..."
                className="w-full bg-transparent text-sm sm:text-base font-medium text-white placeholder-slate-400 focus:outline-none tracking-tight"
              />
            </div>

            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-md bg-slate-900 text-slate-400 border border-slate-800 shadow-sm">
                <span>ESC</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs h-8"
              >
                Close
              </Button>
            </div>
          </div>

          {/* PRESET CHIPS BAR (NO SCROLLBAR) */}
          <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/70 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="text-teal-400 font-semibold text-[11px] whitespace-nowrap flex items-center gap-1 shrink-0">
              <Zap className="h-3 w-3 text-amber-400" />
              <span>Instant:</span>
            </span>
            {[
              'pT3b stage with positive margins',
              'PSA > 10 ng/mL and Gleason 4+3',
              'Biochemical recurrence (PSA >= 0.2)',
              'Surgeon VK bilateral nerve sparing',
              'Pad-free continence at 12m',
              'Overdue follow-ups',
            ].map((pq) => (
              <button
                key={pq}
                type="button"
                onClick={() => setQuery(pq)}
                className="px-3 py-1 rounded-full bg-slate-800/70 hover:bg-teal-900/50 hover:text-teal-200 hover:border-teal-500/50 border border-slate-700/60 text-slate-300 text-[11px] whitespace-nowrap transition-all shrink-0 font-medium"
              >
                {pq}
              </button>
            ))}
          </div>

          {/* PARSED INTENTS BADGES */}
          {searchResponse.parsedQuery.extractedIntents.length > 0 && (
            <div className="px-4 py-2 bg-teal-950/40 border-b border-teal-900/40 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-teal-300 font-semibold text-[11px] flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  <span>Clinical Entities:</span>
                </span>
                {searchResponse.parsedQuery.extractedIntents.map((intent, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-500/40 text-[10px] font-mono font-bold shadow-sm"
                  >
                    {intent}
                  </span>
                ))}
              </div>
              <span className="text-slate-400 text-[11px] font-mono whitespace-nowrap shrink-0">
                {searchResponse.executionTimeMs}ms • {searchResponse.totalMatches} matches
              </span>
            </div>
          )}

          {/* VIEW TABS BAR */}
          {query.trim().length > 0 && (
            <div className="px-4 pt-3 pb-2 border-b border-slate-800/80 flex items-center gap-2 bg-slate-950/60">
              <button
                type="button"
                onClick={() => setActiveTab('cohort')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'cohort'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-900/50 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Matched Patients ({searchResponse.results.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('rag')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'rag'
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-900/50 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>AI Clinical Synthesis (RAG)</span>
              </button>
            </div>
          )}

          {/* MODAL BODY */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {!query.trim() ? (
              /* ELEGANT EMPTY / READY STATE */
              <div className="py-6 space-y-6 max-w-2xl mx-auto">
                <div className="text-center space-y-2">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border border-teal-500/30 text-teal-300 shadow-[0_0_30px_rgba(20,184,166,0.25)]">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Clinical Semantic Search & RAG</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Search the surgical registry in natural doctor language. Instant in-memory BM25 retrieval, oncological constraint matching, and AI cohort synthesis.
                  </p>
                </div>

                {/* CATEGORIZED EXPLORATION TEMPLATES */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {TEMPLATE_CATEGORIES.map((cat, idx) => {
                    const IconComp = cat.icon;
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-800/90 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700 transition-all space-y-2.5"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-teal-400">
                          <IconComp className="h-4 w-4 text-teal-400" />
                          <span>{cat.category}</span>
                        </div>
                        <div className="space-y-1.5">
                          {cat.queries.map((qText, qIdx) => (
                            <button
                              key={qIdx}
                              type="button"
                              onClick={() => setQuery(qText)}
                              className="w-full text-left p-2 rounded-lg bg-slate-950/60 hover:bg-teal-950/40 hover:text-teal-200 border border-slate-800/80 text-[11px] text-slate-300 transition-colors leading-snug"
                            >
                              &ldquo;{qText}&rdquo;
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* TRUST & PRIVACY BADGES */}
                <div className="pt-2 flex flex-wrap justify-center items-center gap-3 text-[11px] text-slate-400 border-t border-slate-800/60">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>100% In-Memory Local</span>
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
                    <span>🛡️ NHS Caldicott Principle 7</span>
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
                    <span>⚡ Instant BM25 Hybrid Index</span>
                  </span>
                </div>
              </div>
            ) : searchResponse.results.length === 0 ? (
              /* NO RESULTS FOUND */
              <div className="py-12 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="text-sm font-semibold text-slate-200">No matching patients found</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No patient records match the query &ldquo;{query}&rdquo;. Try using broader criteria or clicking one of the sample queries.
                </p>
              </div>
            ) : activeTab === 'cohort' ? (
              /* COHORT MATCHES LIST */
              <div className="space-y-2.5">
                {searchResponse.results.map(({ patient, score, matchReasons }) => (
                  <div
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient.id)}
                    className="group p-3.5 rounded-xl border border-slate-800/90 bg-slate-900/60 hover:bg-slate-800/90 hover:border-teal-500/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                          {patient.firstName} {patient.surname}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono border-slate-700 text-slate-300 bg-slate-950/60">
                          Surgeon {patient.primarySurgeon}
                        </Badge>
                        <span className="text-[11px] font-mono font-bold text-teal-300 bg-teal-950/80 border border-teal-700/60 px-2 py-0.5 rounded-md shadow-sm">
                          {score}% match
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 text-xs text-slate-400 font-mono flex-wrap">
                        <span>NHS: {formatNhsNumber(patient.nhsNumber)}</span>
                        <span>•</span>
                        <span>MRN: {patient.hospitalNumber}</span>
                        <span>•</span>
                        <span>PSA: {formatPsa(patient.baseline?.psa)}</span>
                        {patient.histology?.pathologicalStage && (
                          <>
                            <span>•</span>
                            <span className="text-slate-200 font-semibold">pT{patient.histology.pathologicalStage}</span>
                          </>
                        )}
                        {patient.histology?.surgicalMargins && (
                          <>
                            <span>•</span>
                            <span className={patient.histology.surgicalMargins.includes('Positive') ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
                              {patient.histology.surgicalMargins}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Match Reasons Tags */}
                      {matchReasons.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {matchReasons.map((reason, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-slate-950/90 text-teal-200 text-[10px] border border-teal-900/50 font-medium"
                            >
                              ✓ {reason}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="self-end sm:self-center gap-1.5 text-xs text-teal-400 group-hover:text-teal-300 group-hover:bg-teal-950/40 group-hover:translate-x-0.5 transition-all shrink-0"
                    >
                      <span>View Record</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              /* AI CLINICAL RAG SYNTHESIS VIEW */
              <div className="space-y-5">
                {/* Executive Summary Card */}
                <div className="p-4 sm:p-5 rounded-2xl border border-teal-500/40 bg-gradient-to-br from-teal-950/40 via-slate-900 to-slate-900 shadow-xl space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-300">
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>Executive Cohort Summary</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                    {ragOutput.summary}
                  </p>
                </div>

                {/* Key Cohort Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 font-medium">Matched Cohort</span>
                    <div className="text-xl font-bold text-white">{ragOutput.keyMetrics.matchedCohortSize}</div>
                    <span className="text-[10px] text-slate-400">Cases evaluated</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 font-medium">Mean Pre-Op PSA</span>
                    <div className="text-xl font-bold text-teal-400">{ragOutput.keyMetrics.meanPsa} <span className="text-xs font-normal">ng/mL</span></div>
                    <span className="text-[10px] text-slate-400">Cohort baseline</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 font-medium">Positive Margins (R1)</span>
                    <div className="text-xl font-bold text-amber-400">{ragOutput.keyMetrics.positiveMarginRatePercent}%</div>
                    <span className="text-[10px] text-slate-400">Surgical margin rate</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-[11px] text-slate-400 font-medium">BCR Alerts</span>
                    <div className="text-xl font-bold text-rose-400">{ragOutput.keyMetrics.bcrAlertCount}</div>
                    <span className="text-[10px] text-slate-400">PSA ≥ 0.2 ng/mL</span>
                  </div>
                </div>

                {/* Clinical Findings */}
                {ragOutput.clinicalFindings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Key Pathological & Operative Findings</h4>
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                      {ragOutput.clinicalFindings.map((finding, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{finding}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actionable MDT Recommendations */}
                {ragOutput.actionableInsights.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Actionable Clinical Insights & MDT Alerts</h4>
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                      {ragOutput.actionableInsights.map((insight, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <Activity className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="px-5 py-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-teal-400" />
              <span className="text-slate-300 font-medium">In-House BM25 & Clinical RAG Engine</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span>Indexed: <strong className="text-white">{allPatients.length} records</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

