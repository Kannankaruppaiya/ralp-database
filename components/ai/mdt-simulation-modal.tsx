'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Printer,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Scissors,
  Microscope,
  Stethoscope,
  FileText,
  ShieldCheck,
  ArrowRight,
  User,
  Calendar,
  Layers,
} from 'lucide-react';
import { PatientFullRecord } from '@/types/patient';
import { runMultiAgentMDTSimulation, MDTConsensusReport, AgentOpinion } from '@/lib/ai/multi-agent-mdt';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatNhsNumber, formatDate } from '@/lib/formatters';

interface MDTSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientFullRecord;
}

export function MDTSimulationModal({ isOpen, onClose, patient }: MDTSimulationModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'agents' | 'letter'>('agents');

  if (!isOpen) return null;

  const report: MDTConsensusReport = runMultiAgentMDTSimulation(patient);

  const handleCopyLetter = () => {
    navigator.clipboard.writeText(report.officialLetterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>NHS MDT Decision - ${patient.firstName} ${patient.surname}</title>
            <style>
              body { font-family: monospace; padding: 30px; white-space: pre-wrap; font-size: 13px; line-height: 1.5; color: #000; }
            </style>
          </head>
          <body>${report.officialLetterText}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const getAgentIcon = (iconName: string) => {
    switch (iconName) {
      case 'Scissors':
        return <Scissors className="h-5 w-5 text-teal-400" />;
      case 'Microscope':
        return <Microscope className="h-5 w-5 text-purple-400" />;
      case 'Activity':
        return <Activity className="h-5 w-5 text-rose-400" />;
      default:
        return <Stethoscope className="h-5 w-5 text-teal-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 md:p-10 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Double-Bezel Outer Glow Container */}
      <div className="relative w-full max-w-5xl rounded-[1.75rem] p-1.5 bg-gradient-to-b from-white/20 via-white/5 to-purple-500/10 shadow-[0_0_90px_-20px_rgba(168,85,247,0.35),0_25px_50px_-12px_rgba(0,0,0,0.85)] border border-white/10 overflow-hidden">
        
        {/* Solid Modal Container */}
        <div className="rounded-[calc(1.75rem-0.375rem)] bg-slate-950 border border-slate-800/90 overflow-hidden flex flex-col max-h-[85vh] text-slate-100 shadow-inner">
          
          {/* HEADER */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-teal-500/20 border border-purple-500/30 text-purple-300 shadow-inner">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    AI Multi-Agent MDT Clinical Decision Simulator
                  </h2>
                  <Badge variant="purple" className="text-[10px] uppercase font-mono">
                    3 AI Specialists
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Case Review: <strong className="text-white">{patient.firstName} {patient.surname}</strong> • NHS: {formatNhsNumber(patient.nhsNumber)} • MRN: {patient.hospitalNumber}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
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

          {/* VIEW TABS BAR */}
          <div className="px-4 pt-3 pb-2 border-b border-slate-800/80 flex items-center justify-between gap-2 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('agents')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'agents'
                    ? 'bg-purple-600 text-white shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Specialist Agents Consensus</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('letter')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'letter'
                    ? 'bg-purple-600 text-white shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Official NHS MDT Letter</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLetter}
                className="h-7 px-2.5 text-xs gap-1.5 border-slate-700 bg-slate-900 text-slate-300 hover:text-white"
              >
                {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Letter'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-7 px-2.5 text-xs gap-1.5 border-slate-700 bg-slate-900 text-slate-300 hover:text-white"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Record</span>
              </Button>
            </div>
          </div>

          {/* MODAL BODY */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {activeTab === 'agents' ? (
              <>
                {/* OVERALL CONSENSUS BANNER */}
                <div className="p-4 sm:p-5 rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 shadow-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300">
                      <Sparkles className="h-4 w-4 text-amber-300" />
                      <span>Formal MDT Meeting Consensus</span>
                    </div>
                    <Badge variant={report.clinicalRiskTier.includes('Critical') ? 'destructive' : report.clinicalRiskTier.includes('High') ? 'warning' : 'success'}>
                      {report.clinicalRiskTier}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                    {report.overallMDTDecision}
                  </p>
                </div>

                {/* 3 SPECIALIST AGENTS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {report.agents.map((agent, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between space-y-3 shadow-sm hover:border-slate-700 transition-all"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 border border-slate-800">
                              {getAgentIcon(agent.avatarIcon)}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white">{agent.agentName}</div>
                              <div className="text-[10px] text-slate-400">{agent.role}</div>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-2 font-normal">
                          {agent.summary}
                        </p>

                        {/* Findings */}
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Key Evidence:</div>
                          {agent.keyFindings.map((f, fIdx) => (
                            <div key={fIdx} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                              <span className="text-teal-400 mt-0.5">•</span>
                              <span className="leading-snug">{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div className="space-y-1 pt-2 border-t border-slate-800/80">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Specialist Recommendation:</div>
                        {agent.recommendations.map((r, rIdx) => (
                          <div key={rIdx} className="text-[11px] text-slate-200 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                            {r}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* AGREED ACTION PLAN MATRIX */}
                <div className="p-4 sm:p-5 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-teal-400" />
                    <span>Multidisciplinary Agreed Management Plan</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-medium uppercase">Surveillance Schedule</span>
                      <div className="font-semibold text-teal-300">{report.actionPlan.surveillanceSchedule}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-medium uppercase">Adjuvant / Salvage RT</span>
                      <div className="font-semibold text-slate-200">{report.actionPlan.adjuvantTherapyDetails}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-medium uppercase">Functional Rehab (PROMs)</span>
                      <div className="font-semibold text-purple-300">{report.actionPlan.promsFocus}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-medium uppercase">Clinical Trials</span>
                      <div className="font-semibold text-slate-300">{report.actionPlan.clinicalTrialEligibility}</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* OFFICIAL LETTER VIEW */
              <div className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-950 shadow-inner font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed space-y-2">
                {report.officialLetterText}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="px-5 py-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-400" />
              <span className="text-slate-300 font-medium">Multi-Agent MDT Clinical Decision Engine (NICE NG131 / EAU Guidelines)</span>
            </div>
            <div className="text-[11px] font-mono">
              <span>Caldicott Principle 7 Validated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
