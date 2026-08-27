'use client';

import React from 'react';
import { PatientFullRecord } from '@/types/patient';
import { formatDate, formatPsa } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Dna, Scissors, Microscope, CalendarClock, ClipboardList, CheckCircle2 } from 'lucide-react';

export function PatientTimeline({ patient }: { patient: PatientFullRecord }) {
  const events = [
    {
      date: patient.baseline?.biopsyDate || patient.baseline?.psaDate || patient.createdAt,
      title: 'Baseline Prostate Cancer Diagnosis',
      category: 'Diagnostic',
      icon: Dna,
      color: 'bg-cyan-500 text-white',
      details: `Pre-op PSA ${formatPsa(patient.baseline?.psa)} | Gleason ${patient.baseline?.gleasonGrade || '—'} | Stage ${patient.baseline?.clinicalStage || '—'}`,
    },
    {
      date: patient.operation?.operationDate,
      title: `RALP Robotic Operation (${patient.primarySurgeon})`,
      category: 'Surgical',
      icon: Scissors,
      color: 'bg-teal-600 text-white',
      details: `Nerve Sparing: ${patient.operation?.nerveSparing || '—'} | Bladder Neck: ${patient.operation?.bladderNeck || '—'} | EBL: ${patient.operation?.bloodLossMl || 0}ml`,
    },
    ...(patient.histology?.reportDate
      ? [
          {
            date: patient.histology.reportDate,
            title: 'Post-Op Histopathology Report',
            category: 'Pathology',
            icon: Microscope,
            color: 'bg-purple-600 text-white',
            details: `Gleason ${patient.histology.gleasonGrade} (GG${patient.histology.gradeGroup}) | pT${patient.histology.pathologicalStage} | Margins: ${patient.histology.surgicalMargins}`,
          },
        ]
      : []),
    ...patient.followUps
      .filter((f) => f.status === 'completed')
      .map((f) => ({
        date: f.completedDate || f.dueDate,
        title: `${f.milestone.toUpperCase()} Follow-up Milestone (${f.targetMonths} Months)`,
        category: 'Follow-up',
        icon: CalendarClock,
        color: 'bg-emerald-600 text-white',
        details: `PSA: ${formatPsa(f.psa)} | Continence: ${f.continence?.dayStatus || '—'} | SHIM: ${f.shimScore?.totalScore ? `${f.shimScore.totalScore}/25` : '—'} | IPSS: ${f.ipssScore?.totalScore ? `${f.ipssScore.totalScore}/35` : '—'}`,
      })),
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
        <CalendarClock className="h-5 w-5 text-teal-600" />
        <span>Longitudinal Clinical Care Pathway Timeline</span>
      </h2>

      <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {events.map((evt, idx) => {
          const Icon = evt.icon;
          return (
            <div key={idx} className="relative group">
              {/* Dot Icon */}
              <div className={`absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full shadow-sm ring-4 ring-white dark:ring-slate-900 ${evt.color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>

              {/* Event Content */}
              <div className="pl-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">{formatDate(evt.date)}</span>
                  <Badge variant="outline" className="text-[10px]">{evt.category}</Badge>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">{evt.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{evt.details}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PatientTimelineEvent() {
  return null;
}
