'use client';

import React from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { RecoveryCurve } from '@/components/analytics/recovery-curve';
import { useOutcomes } from '@/hooks/use-outcomes';

const pct = (v: number | null) => (v === null ? '—' : `${v}%`);

export default function OutcomesPage() {
  const { curve, isLoading, error } = useOutcomes();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Functional & Oncological Outcomes"
        description="Recovery by milestone across the 3-year follow-up protocol"
        breadcrumbs={[{ label: 'Analytics', href: '/analytics' }, { label: 'Outcomes' }]}
      />

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">{error}</div>
      )}

      <RecoveryCurve curve={curve} />

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Milestone</TableHead>
                <TableHead>Assessed</TableHead>
                <TableHead>Pad-free continence</TableHead>
                <TableHead>Potency (SHIM ≥ 17)</TableHead>
                <TableHead>Mean PSA</TableHead>
                <TableHead>BCR events</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                    Loading outcomes…
                  </TableCell>
                </TableRow>
              ) : curve.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                    No completed assessments yet.
                  </TableCell>
                </TableRow>
              ) : (
                curve.map((p) => (
                  <TableRow key={p.milestone}>
                    <TableCell className="font-semibold">{p.months} months</TableCell>
                    <TableCell>{Math.max(p.continenceN, p.potencyN)}</TableCell>
                    <TableCell>{pct(p.continentPct)}</TableCell>
                    <TableCell>{pct(p.potentPct)}</TableCell>
                    <TableCell>{p.meanPsa === null ? '—' : `${p.meanPsa} ng/mL`}</TableCell>
                    <TableCell className={p.bcrCount > 0 ? 'font-semibold text-destructive' : ''}>
                      {p.bcrCount}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
