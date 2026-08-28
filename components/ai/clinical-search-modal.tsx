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

const PRESET_QUERIES = [
  'pT3b stage with positive surgical margins',
  'PSA > 10 ng/mL and Gleason 4+3',
  'Biochemical recurrence (PSA >= 0.2) alerts',
  'Surgeon VK cases with bilateral nerve sparing',
  'Pad-free continence at 12m follow-up',
  'Overdue milestone follow-ups',
];

export function ClinicalSearchModal({ isOpen, onClose }: ClinicalSearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'cohort' | 'rag'>('cohort');
  const [isSearching, setIsSearching] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-10 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-slate-100">
        {/* TOP BAR: Search Input */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <Sparkles className="h-5 w-5" />
          </div>

          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by medical query, stage (e.g. pT3a), Gleason 4+3, margin R1, PSA > 10..."
              className="w-full bg-transparent text-sm sm:text-base font-medium text-white placeholder-slate-400 focus:outline-none"
            />
          </div>

          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono border border-slate-700">
              ESC
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Close
            </Button>
          </div>
        </div>

        {/* PRESET CHIPS BAR */}
        <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
          <span className="text-slate-400 font-semibold whitespace-nowrap flex items-center gap-1">
            <Stethoscope className="h-3 w-3 text-teal-400" />
            <span>Try:</span>
          </span>
          {PRESET_QUERIES.map((pq) => (
            <button
              key={pq}
              type="button"
              onClick={() => setQuery(pq)}
              className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-teal-900/40 hover:text-teal-200 border border-slate-700/60 text-slate-300 text-[11px] whitespace-nowrap transition-colors"
            >
              {pq}
            </button>
          ))}
        </div>

        {/* QUERY PARSER INTENTS BAR */}
        {searchResponse.parsedQuery.extractedIntents.length > 0 && (
          <div className="px-4 py-2 bg-teal-950/30 border-b border-teal-900/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-teal-400 font-medium">Parsed Clinical Entities:</span>
              {searchResponse.parsedQuery.extractedIntents.map((intent, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-200 border border-teal-500/30 text-[10px] font-mono font-bold"
                >
                  {intent}
                </span>
              ))}
            </div>
            <span className="text-slate-400 text-[11px] font-mono whitespace-nowrap">
              {searchResponse.executionTimeMs}ms • {searchResponse.totalMatches} matches
            </span>
          </div>
        )}

        {/* VIEW TABS BAR */}
        {query.trim().length > 0 && (
          <div className="px-4 pt-3 pb-2 border-b border-slate-800 flex items-center gap-2 bg-slate-900">
            <button
              type="button"
              onClick={() => setActiveTab('cohort')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'cohort'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Matched Patients ({searchResponse.results.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rag')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'rag'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>AI Clinical Synthesis (RAG)</span>
            </button>
          </div>
        )}

        {/* BODY AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {!query.trim() ? (
            /* EMPTY INITIAL STATE */
            <div className="py-12 text-center space-y-4 max-w-md mx-auto">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <Sparkles className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Clinical Semantic Search & RAG</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Search the entire surgical registry using natural medical language, oncological stages, PSA thresholds, Gleason grades, or outcome milestones.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-2 text-[11px] text-slate-400">
                <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700">🔒 100% In-Memory Local</span>
                <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700">🛡️ Caldicott Principle 7</span>
                <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700">⚡ Instant BM25 Ranking</span>
              </div>
            </div>
          ) : searchResponse.results.length === 0 ? (
            /* NO RESULTS FOUND */
            <div className="py-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="text-sm font-semibold text-slate-200">No matching patients found</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No patient records match the query &ldquo;{query}&rdquo;. Try using broader criteria or clicking one of the sample queries above.
              </p>
            </div>
          ) : activeTab === 'cohort' ? (
            /* COHORT MATCHES LIST */
            <div className="space-y-2.5">
              {searchResponse.results.map(({ patient, score, matchReasons }) => (
                <div
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient.id)}
                  className="group p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 hover:border-teal-500/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                        {patient.firstName} {patient.surname}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono border-slate-700 text-slate-300">
                        {patient.primarySurgeon}
                      </Badge>
                      <span className="text-[11px] font-mono font-bold text-teal-400 bg-teal-950/60 border border-teal-800/50 px-2 py-0.5 rounded-md">
                        {score}% match
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                      <span>NHS: {formatNhsNumber(patient.nhsNumber)}</span>
                      <span>•</span>
                      <span>MRN: {patient.hospitalNumber}</span>
                      <span>•</span>
                      <span>PSA: {formatPsa(patient.baseline?.psa)}</span>
                      {patient.histology?.pathologicalStage && (
                        <>
                          <span>•</span>
                          <span className="text-slate-300 font-semibold">pT{patient.histology.pathologicalStage}</span>
                        </>
                      )}
                    </div>

                    {/* Match Reasons Tags */}
                    {matchReasons.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {matchReasons.map((reason, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700/80 font-medium"
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
                    className="self-end sm:self-center gap-1 text-xs text-teal-400 group-hover:text-teal-300 group-hover:translate-x-0.5 transition-transform"
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
              <div className="p-4 rounded-xl border border-teal-500/30 bg-teal-950/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>Executive Cohort Summary</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {ragOutput.summary}
                </p>
              </div>

              {/* Key Cohort Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium">Matched Cohort</span>
                  <div className="text-lg font-bold text-white">{ragOutput.keyMetrics.matchedCohortSize}</div>
                  <span className="text-[10px] text-slate-400">Cases evaluated</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium">Mean Pre-Op PSA</span>
                  <div className="text-lg font-bold text-teal-400">{ragOutput.keyMetrics.meanPsa} <span className="text-xs font-normal">ng/mL</span></div>
                  <span className="text-[10px] text-slate-400">Cohort baseline</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium">Positive Margins (R1)</span>
                  <div className="text-lg font-bold text-amber-400">{ragOutput.keyMetrics.positiveMarginRatePercent}%</div>
                  <span className="text-[10px] text-slate-400">Surgical margin rate</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium">BCR Alerts</span>
                  <div className="text-lg font-bold text-rose-400">{ragOutput.keyMetrics.bcrAlertCount}</div>
                  <span className="text-[10px] text-slate-400">PSA ≥ 0.2 ng/mL</span>
                </div>
              </div>

              {/* Clinical Findings */}
              {ragOutput.clinicalFindings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Key Pathological & Operative Findings</h4>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    {ragOutput.clinicalFindings.map((finding, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 shrink-0 mt-0.5" />
                        <span>{finding}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actionable MDT Recommendations */}
              {ragOutput.actionableInsights.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Actionable Clinical Insights & MDT Alerts</h4>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    {ragOutput.actionableInsights.map((insight, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <Activity className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Powered by In-House BM25 & Clinical RAG Engine</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Total Registry Indexed: <strong className="text-white">{allPatients.length}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
