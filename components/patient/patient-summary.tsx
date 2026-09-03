import React from 'react';
import { PatientFullRecord } from '@/types/patient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPsa, formatDate } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Dna, Scissors, Microscope, CalendarClock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function PatientSummary({ patient }: { patient: PatientFullRecord }) {
  const hasRecurrence = patient.followUps?.some((f) => f.biochemicalRecurrence);
  const latestFollowUp = patient.followUps && patient.followUps.length > 0 ? patient.followUps[patient.followUps.length - 1] : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Pre-Op Cancer Summary */}
      <Card className="border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-500" />
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Dna className="h-4 w-4 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
            <span>Baseline Cancer</span>
          </CardTitle>
          <Badge variant="outline" className="text-[10px] bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 font-semibold">
            Pre-op
          </Badge>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">PSA:</span>
            <strong className="text-slate-900 dark:text-white font-bold font-mono [font-variant-numeric:tabular-nums]">
              {formatPsa(patient.baseline?.psa)}
            </strong>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Gleason Grade:</span>
            <strong className="text-slate-900 dark:text-white font-bold">
              {patient.baseline?.gleasonGrade || '—'} (GG{patient.baseline?.gradeGroup || '—'})
            </strong>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500 dark:text-slate-400">Clinical Stage:</span>
            <strong className="text-slate-900 dark:text-white font-bold">
              Stage {patient.baseline?.clinicalStage || '—'}
            </strong>
          </div>
        </CardContent>
      </Card>

      {/* Operation Summary */}
      <Card className="border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Scissors className="h-4 w-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
            <span>RALP Procedure</span>
          </CardTitle>
          <Badge className="text-[10px] bg-teal-600 text-white font-bold">{patient.primarySurgeon}</Badge>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Date:</span>
            <strong className="text-slate-900 dark:text-white font-bold font-mono [font-variant-numeric:tabular-nums]">
              {formatDate(patient.operation?.operationDate)}
            </strong>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Nerve Sparing:</span>
            <strong className="text-teal-700 dark:text-teal-300 font-bold">{patient.operation?.nerveSparing || '—'}</strong>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500 dark:text-slate-400">Bladder Neck:</span>
            <strong className="text-slate-900 dark:text-white font-bold capitalize">{patient.operation?.bladderNeck || '—'}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Histology Summary */}
      <Card className="border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Microscope className="h-4 w-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            <span>Post-Op Histology</span>
          </CardTitle>
          <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 font-mono">
            pT{patient.histology?.pathologicalStage || '—'}
          </Badge>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Path Gleason:</span>
            <strong className="text-slate-900 dark:text-white font-bold">
              {patient.histology?.gleasonGrade || '—'} (GG{patient.histology?.gradeGroup || '—'})
            </strong>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Surgical Margins:</span>
            <strong className={patient.histology?.surgicalMargins?.includes('Positive') ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-700 dark:text-emerald-400 font-bold'}>
              {patient.histology?.surgicalMargins || '—'}
            </strong>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500 dark:text-slate-400">EPE / SVI:</span>
            <strong className="text-slate-900 dark:text-white font-bold">
              {patient.histology?.extraprostaticExtension ? 'EPE+' : 'EPE-'} / {patient.histology?.seminalVesicleInvasion ? 'SVI+' : 'SVI-'}
            </strong>
          </div>
        </CardContent>
      </Card>

      {/* Latest Functional Status */}
      <Card className="border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <CalendarClock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>Latest Outcome</span>
          </CardTitle>
          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
            Follow-up
          </Badge>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Latest PSA:</span>
            <strong className="text-slate-900 dark:text-white font-bold font-mono [font-variant-numeric:tabular-nums]">
              {latestFollowUp ? formatPsa(latestFollowUp.psa) : 'Pending'}
            </strong>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Recurrence (BCR):</span>
            <strong className={hasRecurrence ? 'text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1' : 'text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1'}>
              {hasRecurrence ? (
                <>
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                  <span>BCR Detected</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  <span>No BCR</span>
                </>
              )}
            </strong>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500 dark:text-slate-400">Review Stage:</span>
            <strong className="text-slate-900 dark:text-white font-bold">
              {latestFollowUp ? `${latestFollowUp.milestone.toUpperCase()} (${latestFollowUp.targetMonths}m)` : 'Pre-milestone'}
            </strong>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PatientStatus({ status }: { status: string }) {
  return (
    <Badge variant={status === 'Active' ? 'success' : 'secondary'}>
      {status}
    </Badge>
  );
}
