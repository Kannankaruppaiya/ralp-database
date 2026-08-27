'use client';

import React, { useState } from 'react';
import { AuditLogEntry } from '@/types/audit';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/date';
import { ShieldCheck, History, User, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 20;

export function AuditLogTable({ logs }: { logs: AuditLogEntry[] }) {
  const [page, setPage] = useState(1);

  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        No audit log events recorded yet.
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const paginatedLogs = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
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
              <TableRow key={log.id}>
                <TableCell className="text-xs font-mono text-slate-500">
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
                <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                  {log.details}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 text-xs text-slate-500">
          <span>
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, logs.length)} of {logs.length} events
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs"
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
              className="h-8 gap-1 text-xs"
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

export function AuditEvent() {
  return null;
}

export function ChangeHistory() {
  return null;
}
