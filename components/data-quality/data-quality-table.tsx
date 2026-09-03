'use client';

import React from 'react';
import { PatientFullRecord } from '@/types/patient';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function DataQualityTable({ patients }: { patients: PatientFullRecord[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-[#272727] dark:bg-[#181818]">
      <Table>
        <TableHeader className="bg-slate-50/90 dark:bg-[#121212]/90 backdrop-blur-sm">
          <TableRow className="border-b border-slate-200 dark:border-[#272727]">
            <TableHead>Patient</TableHead>
            <TableHead>Surgeon</TableHead>
            <TableHead>Overall Score</TableHead>
            <TableHead>Baseline Cancer</TableHead>
            <TableHead>Theatre Note</TableHead>
            <TableHead>Histology</TableHead>
            <TableHead>Follow-ups</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((p) => (
            <TableRow key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-[#1F1F1F]/60 transition-colors duration-200 border-b border-slate-100 dark:border-[#272727]">
              <TableCell className="font-semibold text-xs text-slate-900 dark:text-slate-100 py-3">
                <Link href={`/patients/${p.id}`} className="hover:text-teal-600 dark:hover:text-teal-400 font-bold transition-colors">
                  {p.firstName} {p.surname}
                </Link>
                <span className="block text-[10px] font-normal text-slate-400 font-mono mt-0.5 [font-variant-numeric:tabular-nums]">
                  {p.hospitalNumber}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-semibold">{p.primarySurgeon}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={p.completeness.score >= 85 ? 'success' : p.completeness.score >= 60 ? 'warning' : 'destructive'}
                  className="font-mono text-xs [font-variant-numeric:tabular-nums] font-semibold"
                >
                  {p.completeness.score}%
                </Badge>
              </TableCell>
              <TableCell>
                {p.completeness.baselineComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                )}
              </TableCell>
              <TableCell>
                {p.completeness.operationComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                )}
              </TableCell>
              <TableCell>
                {p.completeness.histologyComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                )}
              </TableCell>
              <TableCell className="text-xs text-slate-600 dark:text-slate-400 [font-variant-numeric:tabular-nums]">
                {p.completeness.followUpsComplete} / 7
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/patients/${p.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs font-semibold">
                    <span>Resolve</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export { CompletenessCard } from './completeness-card';
export { ConflictSummary } from './conflict-summary';
export { MissingDataList } from './missing-data-list';
