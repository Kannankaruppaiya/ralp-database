'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileQuestion, ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';

export interface MissingDataItem {
  id: string;
  patientId: string;
  patientName: string;
  hospitalNumber: string;
  surgeon: string;
  missingField: string;
  daysPending: number;
  stage: 'Baseline' | 'Operation' | 'Histology' | 'PROMs';
}

export function MissingDataList({
  items,
}: {
  items: MissingDataItem[];
}) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm dark:border-[#272727] dark:bg-[#181818]">
      <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-[#272727] flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 dark:border dark:border-rose-900/60">
            <FileQuestion className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
              Critical Missing Data Items Queue
            </CardTitle>
            <p className="text-[11px] text-slate-500 font-medium">Pending items impacting national audit submissions</p>
          </div>
        </div>
        <Badge variant="destructive" className="text-[10px] font-mono [font-variant-numeric:tabular-nums]">
          {items.length} Items Pending
        </Badge>
      </CardHeader>

      <CardContent className="p-5 space-y-3">
        {items.length === 0 ? (
          <p className="text-center py-6 text-xs text-slate-500">No high-priority missing data items pending.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#FAFAFA] dark:bg-[#121212] border border-slate-200 dark:border-[#272727] hover:border-teal-500/50 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {item.stage}
                  </Badge>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{item.missingField}</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span>Patient: <strong className="text-slate-800 dark:text-slate-200">{item.patientName}</strong></span>
                  <span>•</span>
                  <span className="font-mono [font-variant-numeric:tabular-nums]">MRN: {item.hospitalNumber}</span>
                  <span>•</span>
                  <span>Surgeon: {item.surgeon}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono [font-variant-numeric:tabular-nums]">
                    <Clock className="h-3 w-3" />
                    {item.daysPending}d overdue
                  </span>
                </div>
              </div>

              <Link href={`/patients/${item.patientId}`} className="shrink-0">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 font-semibold">
                  <span>Enter Data</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
