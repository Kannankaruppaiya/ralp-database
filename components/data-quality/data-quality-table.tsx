'use client';

import React from 'react';
import { PatientFullRecord } from '@/types/patient';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function DataQualityTable({ patients }: { patients: PatientFullRecord[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <Table>
        <TableHeader>
          <TableRow>
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
            <TableRow key={p.id}>
              <TableCell className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                <Link href={`/patients/${p.id}`} className="hover:text-teal-600">
                  {p.firstName} {p.surname}
                </Link>
                <span className="block text-xs font-normal text-slate-400 font-mono">
                  {p.hospitalNumber}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{p.primarySurgeon}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={p.completeness.score >= 85 ? 'success' : p.completeness.score >= 60 ? 'warning' : 'destructive'}
                  className="font-mono text-xs"
                >
                  {p.completeness.score}%
                </Badge>
              </TableCell>
              <TableCell>
                {p.completeness.baselineComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                )}
              </TableCell>
              <TableCell>
                {p.completeness.operationComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                )}
              </TableCell>
              <TableCell>
                {p.completeness.histologyComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                )}
              </TableCell>
              <TableCell className="text-xs text-slate-600">
                {p.completeness.followUpsComplete} / 7
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/patients/${p.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
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

export function CompletenessCard() {
  return null;
}

export function ConflictSummary() {
  return null;
}

export function MissingDataList() {
  return null;
}
