'use client';

import React, { useState } from 'react';
import { AuditLogEntry } from '@/types/audit';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/date';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 20;

export function AuditLogTable({ logs }: { logs: AuditLogEntry[] }) {
  const [page, setPage] = useState(1);

  if (logs.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm dark:border-[#272727] dark:bg-[#181818]">
        No audit log events recorded yet.
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const paginatedLogs = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-[#272727] dark:bg-[#181818]">
        <Table>
          <TableHeader className="bg-slate-50/90 dark:bg-[#121212]/90 backdrop-blur-sm">
            <TableRow className="border-b border-slate-200 dark:border-[#272727]">
              <TableHead>Timestamp</TableHead>
              <TableHead>User / Clinician</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLogs.map((log) => (
              <TableRow key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-[#1F1F1F]/60 transition-colors duration-200 border-b border-slate-100 dark:border-[#272727]">
                <TableCell className="text-xs font-mono text-slate-500 [font-variant-numeric:tabular-nums]">
                  {formatDateTime(log.timestamp)}
                </TableCell>
                <TableCell className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {log.userName}
                </TableCell>
                <TableCell className="text-xs">
                  <Badge variant="outline">{log.userRole}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="info" className="text-[10px] font-mono">
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  {log.patientName || '—'}
                </TableCell>
                <TableCell className="text-xs text-slate-600 dark:text-slate-400 [text-wrap:pretty]">
                  {log.details}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 text-xs text-slate-500 [font-variant-numeric:tabular-nums]">
          <span>
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, logs.length)} of {logs.length} events
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs font-semibold"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs font-semibold"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export { AuditEvent } from './audit-event';
export { ChangeHistory } from './change-history';
