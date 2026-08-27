import React from 'react';
import { PatientFullRecord } from '@/types/patient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PatientDataField } from './patient-data-field';
import { formatPsa, formatDate, formatBloodLoss, formatDuration } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Dna, Scissors, Microscope, CalendarClock, ShieldCheck } from 'lucide-react';

export function PatientSummary({ patient }: { patient: PatientFullRecord }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Pre-Op Cancer Summary */}
      <Card className="border-l-4 border-l-cyan-500 shadow-sm">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Dna className="h-4 w-4 text-cyan-600" />
            Baseline Cancer
          </CardTitle>
          <Badge variant="info" className="text-[10px]">Pre-op</Badge>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">PSA:</span>
            <strong className="text-slate-900 font-semibold">{formatPsa(patient.baseline?.psa)}</strong>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Gleason Grade:</span>
            <strong className="text-slate-900 font-semibold">{patient.baseline?.gleasonGrade || '—'} (GG{patient.baseline?.gradeGroup})</strong>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Clinical Stage:</span>
            <strong className="text-slate-900 font-semibold">Stage {patient.baseline?.clinicalStage || '—'}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Operation Summary */}
      <Card className="border-l-4 border-l-teal-500 shadow-sm">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Scissors className="h-4 w-4 text-teal-600" />
            RALP Procedure
          </CardTitle>
          <Badge variant="default" className="text-[10px] bg-teal-600">{patient.primarySurgeon}</Badge>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Date:</span>
            <strong className="text-slate-900 font-semibold">{formatDate(patient.operation?.operationDate)}</strong>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Nerve Sparing:</span>
            <strong className="text-slate-900 font-semibold">{patient.operation?.nerveSparing || '—'}</strong>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Bladder Neck:</span>
            <strong className="text-slate-900 font-semibold capitalize">{patient.operation?.bladderNeck || '—'}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Histology Summary */}
      <Card className="border-l-4 border-l-purple-500 shadow-sm">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Microscope className="h-4 w-4 text-purple-600" />
            Post-Op Histology
          </CardTitle>
          <Badge variant="purple" className="text-[10px]">pT{patient.histology?.pathologicalStage || '—'}</Badge>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Path Gleason:</span>
            <strong className="text-slate-900 font-semibold">{patient.histology?.gleasonGrade || '—'} (GG{patient.histology?.gradeGroup})</strong>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">Surgical Margins:</span>
            <strong className={patient.histology?.surgicalMargins?.includes('Positive') ? 'text-rose-600 font-semibold' : 'text-emerald-700 font-semibold'}>
              {patient.histology?.surgicalMargins || '—'}
            </strong>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">EPE / SVI:</span>
            <strong className="text-slate-900 font-semibold">
              {patient.histology?.extraprostaticExtension ? 'EPE+' : 'EPE-'} / {patient.histology?.seminalVesicleInvasion ? 'SVI+' : 'SVI-'}
            </strong>
          </div>
        </CardContent>
      </Card>

      {/* Latest Functional Status */}
      <Card className="border-l-4 border-l-emerald-500 shadow-sm">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <CalendarClock className="h-4 w-4 text-emerald-600" />
            Latest Outcome
          </CardTitle>
          <Badge variant="success" className="text-[10px]">Follow-up</Badge>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-2 text-xs">
          {(() => {
            const completedFUs = patient.followUps.filter((f) => f.status === 'completed');
            const latest = completedFUs[completedFUs.length - 1];
            if (!latest) {
              return (
                <div className="py-3 text-center text-slate-400 italic">
                  No completed follow-ups yet
                </div>
              );
            }
            return (
              <>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Milestone ({latest.milestone}):</span>
                  <strong className="text-slate-900 font-semibold">{formatPsa(latest.psa)}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Continence:</span>
                  <strong className="text-slate-900 font-semibold">{latest.continence?.dayStatus?.split(',')[0] || '—'}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">SHIM Score:</span>
                  <strong className="text-slate-900 font-semibold">{latest.shimScore?.totalScore ? `${latest.shimScore.totalScore}/25` : '—'}</strong>
                </div>
              </>
            );
          })()}
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
