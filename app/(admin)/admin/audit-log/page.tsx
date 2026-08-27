'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { db } from '@/lib/api-client';
import { AuditLogEntry } from '@/types/audit';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatDateTime } from '@/lib/date';
import { Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PAGE_SIZE = 20;

export default function AdminAuditLogPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    void db.getAuditLogs(500).then(setLogs).catch(() => setLogs([]));
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchUser = log.userName.toLowerCase().includes(q);
      const matchPatient = (log.patientName || '').toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      if (!matchUser && !matchPatient && !matchDetails && !matchAction) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const paginatedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExportAudit = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Timestamp,User,Role,Action,Patient,Details']
        .concat(
          filteredLogs.map(
            (l) =>
              `"${l.timestamp}","${l.userName}","${l.userRole}","${l.action}","${l.patientName || ''}","${l.details.replace(/"/g, '""')}"`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `caldicott_audit_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Caldicott Audit Export Generated',
      description: `Exported ${filteredLogs.length} audit trail records to CSV.`,
      variant: 'default',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Caldicott & Security Audit Trail"
        description="Immutable, tamper-evident log of all patient record views, updates, PROM submissions, and exports"
        breadcrumbs={[
          { label: 'Admin Console', href: '/admin' },
          { label: 'Audit Trail' },
        ]}
        action={
          <Button
            onClick={handleExportAudit}
            size="sm"
            className="gap-1.5 shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>Export Audit Log (CSV)</span>
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by clinician, patient, action or details..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 text-sm"
          />
        </div>

        <Select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-48 text-xs"
        >
          <option value="ALL">All Actions</option>
          <option value="PATIENT_CREATED">PATIENT_CREATED</option>
          <option value="PATIENT_UPDATED">PATIENT_UPDATED</option>
          <option value="PROM_SUBMITTED">PROM_SUBMITTED</option>
          <option value="EXTRACTION_APPROVED">EXTRACTION_APPROVED</option>
          <option value="DATA_EXPORT">DATA_EXPORT</option>
        </Select>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Clinician / User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Action Code</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Operation Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!mounted || paginatedLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-sm text-slate-500">
                  {!mounted ? 'Loading audit trail…' : 'No audit log entries found matching criteria.'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 text-xs text-slate-500">
          <span>
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length} events
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
