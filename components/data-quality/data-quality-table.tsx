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
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
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
              <TableCell className="font-semibold text-xs text-foreground dark:text-slate-100">
                <Link href={`/patients/${p.id}`} className="hover:text-primary">
                  {p.firstName} {p.surname}
                </Link>
                <span className="block text-xs font-normal text-muted-foreground font-mono">
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
                  <CheckCircle2 className="h-4 w-4 text-success-muted-foreground" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
              </TableCell>
              <TableCell>
                {p.completeness.operationComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-success-muted-foreground" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
              </TableCell>
              <TableCell>
                {p.completeness.histologyComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-success-muted-foreground" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
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
