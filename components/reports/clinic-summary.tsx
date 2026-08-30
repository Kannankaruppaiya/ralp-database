'use client';

import React from 'react';
import { PatientFullRecord } from '@/types/patient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatNhsNumber, formatPsa, formatBloodLoss, formatDuration } from '@/lib/formatters';
import { SURGEON_OPTIONS } from '@/config/clinical-options';
import { Printer, Download, Hospital, HeartPulse } from 'lucide-react';

export function ClinicSummary({ patient }: { patient: PatientFullRecord }) {
  const handlePrint = () => {
    window.print();
  };

  const surgeonObj = SURGEON_OPTIONS.find((s) => s.value === patient.primarySurgeon);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Print Controls (Hidden when printing) */}
      <div className="no-print flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h2 className="text-sm font-bold text-foreground dark:text-slate-100">
            Multidisciplinary Clinic Summary & Outcome Letter
          </h2>
          <p className="text-xs text-muted-foreground">
            Standard NHS Caldicott-compliant RALP summary report ready for MDT or clinical record.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} className="gap-1.5 shadow-sm">
            <Printer className="h-4 w-4" />
            <span>Print Report (PDF)</span>
          </Button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="bg-card text-foreground p-8 sm:p-12 rounded-xl border border-border shadow-md print:border-0 print:shadow-none print:p-0">
        {/* Letterhead */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
              <HeartPulse className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight uppercase text-foreground">
                Department of Urology & Robotic Surgery
              </h1>
              <p className="text-xs text-muted-foreground">Oxford University Hospitals NHS Foundation Trust</p>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">RALP Surgical Database v2</p>
            <p>Generated: {formatDate(new Date().toISOString())}</p>
          </div>
        </div>

        {/* Section 1: Patient Demographics */}
        <div className="bg-muted p-4 rounded-lg border border-border mb-6 text-xs">
          <h3 className="font-bold text-foreground uppercase tracking-wider mb-2 text-[11px]">
            1. Patient Demographics & Surgeon Details
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-muted-foreground block">Patient Name:</span>
              <strong className="text-foreground text-sm font-bold">{patient.firstName} {patient.surname}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">NHS Number:</span>
              <strong className="text-foreground font-mono font-bold">{formatNhsNumber(patient.nhsNumber)}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Hospital MRN:</span>
              <strong className="text-foreground font-mono">{patient.hospitalNumber}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Date of Birth (Age):</span>
              <strong className="text-foreground">{formatDate(patient.dateOfBirth)} ({patient.age || '—'} yrs)</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Primary Surgeon:</span>
              <strong className="text-foreground">{surgeonObj?.fullName || patient.primarySurgeon}</strong>
            </div>
          </div>
        </div>

        {/* Section 2: Baseline Pre-Op Cancer Data */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-1 mb-3">
            2. Pre-Operative Cancer Baseline
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block">Pre-Op PSA:</span>
              <strong className="text-foreground text-sm">{formatPsa(patient.baseline?.psa)}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Biopsy Gleason Score:</span>
              <strong className="text-foreground">{patient.baseline?.gleasonGrade || '—'} (Grade Group {patient.baseline?.gradeGroup || '—'})</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Clinical Stage:</span>
              <strong className="text-foreground">Stage {patient.baseline?.clinicalStage || '—'}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">UKB Score:</span>
              <strong className="text-foreground">{patient.baseline?.ukbScore || '—'} / 100</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">% Positive Cores (Worst):</span>
              <strong className="text-foreground">{patient.baseline?.percentPositiveCoresWorst ? `${patient.baseline.percentPositiveCoresWorst}%` : '—'}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">% Positive Cores (Best):</span>
              <strong className="text-foreground">{patient.baseline?.percentPositiveCoresBest ? `${patient.baseline.percentPositiveCoresBest}%` : '—'}</strong>
            </div>
          </div>
        </div>

        {/* Section 3: Theatre Operation Data */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-1 mb-3">
            3. Theatre Operation Data (RALP)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block">Operation Date:</span>
              <strong className="text-foreground">{formatDate(patient.operation?.operationDate)}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Bladder Neck:</span>
              <strong className="text-foreground capitalize">{patient.operation?.bladderNeck || '—'}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Nerve Sparing Side:</span>
              <strong className="text-foreground">{patient.operation?.nerveSparing || '—'}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">L / R Sparing Grades:</span>
              <strong className="text-foreground">L: {patient.operation?.leftNerveSparingGrade || '—'} | R: {patient.operation?.rightNerveSparingGrade || '—'}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Sphincter Quality:</span>
              <strong className="text-foreground">{patient.operation?.sphincter || '—'}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Anterior Reconstruction:</span>
              <strong className="text-foreground">{patient.operation?.anteriorReconstruction || '—'}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Lymph Node Dissection:</span>
              <strong className="text-foreground">{patient.operation?.lymphNodeDissection ? `Yes (${patient.operation.lymphNodeCount || ''} nodes)` : 'No'}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Blood Loss / Duration:</span>
              <strong className="text-foreground">{formatBloodLoss(patient.operation?.bloodLossMl)} / {formatDuration(patient.operation?.durationMinutes)}</strong>
            </div>
          </div>
        </div>

        {/* Section 4: Post-Op Histology */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-1 mb-3">
            4. Post-Operative Histology Report
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block">Pathology Gleason:</span>
              <strong className="text-foreground text-sm font-bold">{patient.histology?.gleasonGrade || '—'} (GG{patient.histology?.gradeGroup})</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Pathological Stage:</span>
              <strong className="text-foreground font-bold">pT{patient.histology?.pathologicalStage || '—'}</strong>
            </div>
            <div>
              <span className="text-muted-foreground block">Surgical Margins:</span>
              <strong className={patient.histology?.surgicalMargins?.includes('Positive') ? 'text-rose-600 font-bold' : 'text-foreground'}>
                {patient.histology?.surgicalMargins || '—'}
              </strong>
            </div>
            <div>
              <span className="text-muted-foreground block">EPE / SVI:</span>
              <strong className="text-foreground">
                {patient.histology?.extraprostaticExtension ? 'EPE Present' : 'EPE Clear'} | {patient.histology?.seminalVesicleInvasion ? 'SVI Present' : 'SVI Clear'}
              </strong>
            </div>
          </div>
        </div>

        {/* Section 5: Longitudinal Follow-up Matrix */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-1 mb-3">
            5. Longitudinal Outcomes Surveillance Matrix (2m - 36m)
          </h3>
          <table className="w-full text-xs text-left border border-border">
            <thead className="bg-muted text-foreground">
              <tr>
                <th className="p-2 border-b">Milestone</th>
                <th className="p-2 border-b">Target Due</th>
                <th className="p-2 border-b">PSA (ng/mL)</th>
                <th className="p-2 border-b">Continence</th>
                <th className="p-2 border-b">IPSS (0-35)</th>
                <th className="p-2 border-b">SHIM (1-25)</th>
                <th className="p-2 border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              {patient.followUps.map((fu) => (
                <tr key={fu.id} className="border-b border-border">
                  <td className="p-2 font-bold">{fu.milestone.toUpperCase()} ({fu.targetMonths}m)</td>
                  <td className="p-2 text-muted-foreground">{formatDate(fu.dueDate)}</td>
                  <td className="p-2 font-mono font-bold">{formatPsa(fu.psa)}</td>
                  <td className="p-2">{fu.continence?.dayStatus?.split(',')[0] || '—'}</td>
                  <td className="p-2">{fu.ipssScore?.totalScore !== undefined ? `${fu.ipssScore.totalScore}/35` : '—'}</td>
                  <td className="p-2">{fu.shimScore?.totalScore !== undefined ? `${fu.shimScore.totalScore}/25` : '—'}</td>
                  <td className="p-2 capitalize text-muted-foreground">{fu.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ClinicSummaryHeader() {
  return null;
}

export function ClinicSummarySection() {
  return null;
}

export function PrintActions() {
  return null;
}
