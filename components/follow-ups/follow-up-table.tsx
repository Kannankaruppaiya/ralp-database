'use client';

import React, { useState, useMemo } from 'react';
import { EnrichedFollowUp } from '@/hooks/use-follow-ups';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatDate, formatPsa } from '@/lib/formatters';
import { getDaysRemaining } from '@/lib/date';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Send,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SURGEON_OPTIONS } from '@/config/clinical-options';

type SortField = 'patient' | 'dueDate' | 'milestone' | 'surgeon' | 'psa' | 'status';
type SortOrder = 'asc' | 'desc';

export function FollowUpTable({ followUps }: { followUps: EnrichedFollowUp[] }) {
  const { toast } = useToast();
  const [dispatchedIds, setDispatchedIds] = useState<string[]>([]);
  
  // Table Controls State
  const [search, setSearch] = useState('');
  const [surgeonFilter, setSurgeonFilter] = useState('ALL');
  const [milestoneFilter, setMilestoneFilter] = useState('ALL');
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Filter & Search
  const filteredList = useMemo(() => {
    return followUps.filter((fu) => {
      if (surgeonFilter !== 'ALL' && fu.patient.primarySurgeon !== surgeonFilter) return false;
      if (milestoneFilter !== 'ALL' && fu.milestone.toLowerCase() !== milestoneFilter.toLowerCase()) return false;

      if (search.trim().length >= 2) {
        const q = search.toLowerCase();
        const nameMatch = `${fu.patient.firstName} ${fu.patient.surname}`.toLowerCase().includes(q);
        const nhsMatch = fu.patient.nhsNumber.replace(/\s+/g, '').includes(q.replace(/\s+/g, ''));
        const hospMatch = fu.patient.hospitalNumber.toLowerCase().includes(q);
        if (!nameMatch && !nhsMatch && !hospMatch) return false;
      }
      return true;
    });
  }, [followUps, search, surgeonFilter, milestoneFilter]);

  // Sorting
  const sortedList = useMemo(() => {
    return [...filteredList].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'dueDate') {
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (sortField === 'patient') {
        comparison = `${a.patient.surname} ${a.patient.firstName}`.localeCompare(`${b.patient.surname} ${b.patient.firstName}`);
      } else if (sortField === 'milestone') {
        comparison = a.targetMonths - b.targetMonths;
      } else if (sortField === 'surgeon') {
        comparison = a.patient.primarySurgeon.localeCompare(b.patient.primarySurgeon);
      } else if (sortField === 'psa') {
        comparison = (a.psa ?? -1) - (b.psa ?? -1);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredList, sortField, sortOrder]);

  // Pagination
  const totalRecords = sortedList.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedList = sortedList.slice(startIndex, startIndex + pageSize);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleRequestResponse = (fu: EnrichedFollowUp) => {
    setDispatchedIds((prev) => [...prev, fu.id]);
    toast({
      title: 'Digital PROM Link Dispatched',
      description: `Sent ${fu.milestone.toUpperCase()} questionnaire invite to ${fu.patient.firstName} ${fu.patient.surname} via NHS Notify.`,
      variant: 'default',
    });
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 text-primary" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Industry Standard Search & Filter Controls Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient name, NHS number, MRN..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          <Select
            value={surgeonFilter}
            onChange={(e) => {
              setSurgeonFilter(e.target.value);
              setPage(1);
            }}
            className="w-36 h-9 text-xs"
          >
            <option value="ALL">All Surgeons</option>
            {SURGEON_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                Surgeon {s.value}
              </option>
            ))}
          </Select>

          <Select
            value={milestoneFilter}
            onChange={(e) => {
              setMilestoneFilter(e.target.value);
              setPage(1);
            }}
            className="w-32 h-9 text-xs"
          >
            <option value="ALL">All Milestones</option>
            <option value="6w">6 Weeks (6W)</option>
            <option value="2m">2 Months (2M)</option>
            <option value="6m">6 Months (6M)</option>
            <option value="12m">12 Months (12M)</option>
            <option value="18m">18 Months (18M)</option>
            <option value="24m">24 Months (24M)</option>
            <option value="36m">36 Months (36M)</option>
          </Select>

          <Select
            value={pageSize.toString()}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="w-28 h-9 text-xs"
          >
            <option value="10">10 / page</option>
            <option value="15">15 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </Select>
        </div>
      </div>

      {/* Table Container with Sticky Header & Contained Viewport Height */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="max-h-[580px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm dark:bg-slate-900/95 shadow-sm">
              <TableRow className="border-b border-border dark:border-slate-800">
                <TableHead
                  className="cursor-pointer select-none hover:text-primary transition-colors"
                  onClick={() => toggleSort('patient')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Patient</span>
                    {getSortIcon('patient')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:text-primary transition-colors"
                  onClick={() => toggleSort('milestone')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Milestone</span>
                    {getSortIcon('milestone')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:text-primary transition-colors"
                  onClick={() => toggleSort('surgeon')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Surgeon</span>
                    {getSortIcon('surgeon')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:text-primary transition-colors"
                  onClick={() => toggleSort('dueDate')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Due Date</span>
                    {getSortIcon('dueDate')}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:text-primary transition-colors"
                  onClick={() => toggleSort('psa')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>PSA Status</span>
                    {getSortIcon('psa')}
                  </div>
                </TableHead>
                <TableHead>PROM Checklist</TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:text-primary transition-colors"
                  onClick={() => toggleSort('status')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-sm text-muted-foreground">
                    No follow-up records found matching the active filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedList.map((fu) => {
                  const { isOverdue, label: dueLabel } = getDaysRemaining(fu.dueDate);
                  const isDispatched = dispatchedIds.includes(fu.id);
                  const hasPsa = fu.psa !== undefined;
                  const hasIpss = fu.ipssScore?.totalScore !== undefined;
                  const hasShim = fu.shimScore?.totalScore !== undefined;
                  const hasContinence = fu.continence?.dayStatus !== undefined;

                  return (
                    <TableRow key={fu.id} className="hover:bg-muted/70 dark:hover:bg-slate-800/40 transition-colors">
                      <TableCell className="font-semibold text-foreground dark:text-slate-100 py-3">
                        <Link href={`/patients/${fu.patient.id}`} className="hover:text-primary transition-colors">
                          {fu.patient.firstName} {fu.patient.surname}
                        </Link>
                        <span className="block text-[11px] font-normal text-muted-foreground font-mono mt-0.5">
                          MRN: {fu.patient.hospitalNumber} • NHS: {fu.patient.nhsNumber}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-foreground dark:text-slate-200">
                          {fu.milestone.toUpperCase()}
                        </span>
                        <span className="text-[11px] text-muted-foreground block font-mono">({fu.targetMonths}m)</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-bold text-[11px]">{fu.patient.primarySurgeon}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium font-mono">
                        {formatDate(fu.dueDate)}
                      </TableCell>
                      <TableCell className="text-xs font-mono font-medium">
                        {hasPsa ? (
                          <span className={fu.biochemicalRecurrence ? 'text-red-600 font-bold' : 'text-primary dark:text-teal-400 font-bold'}>
                            {formatPsa(fu.psa)} {fu.biochemicalRecurrence && '⚠️'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">Pending PSA</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className={hasIpss ? 'text-success-muted-foreground dark:text-emerald-400 font-bold' : 'text-muted-foreground dark:text-slate-600'} title="IPSS">
                            IPSS {hasIpss ? '✓' : '✕'}
                          </span>
                          <span>•</span>
                          <span className={hasShim ? 'text-purple-700 dark:text-purple-400 font-bold' : 'text-muted-foreground dark:text-slate-600'} title="SHIM">
                            SHIM {hasShim ? '✓' : '✕'}
                          </span>
                          <span>•</span>
                          <span className={hasContinence ? 'text-blue-700 dark:text-blue-400 font-bold' : 'text-muted-foreground dark:text-slate-600'} title="Continence">
                            Cont {hasContinence ? '✓' : '✕'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {fu.status === 'completed' ? (
                          <Badge variant="success" className="gap-1 text-[10px] font-semibold">
                            <CheckCircle2 className="h-3 w-3" /> Completed
                          </Badge>
                        ) : isOverdue ? (
                          <Badge variant="destructive" className="gap-1 text-[10px] font-semibold">
                            <AlertCircle className="h-3 w-3" /> {dueLabel}
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="gap-1 text-[10px] font-semibold">
                            <Clock className="h-3 w-3" /> {dueLabel}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {fu.status !== 'completed' && (
                            <Button
                              size="sm"
                              variant={isDispatched ? 'secondary' : 'default'}
                              className="h-7 gap-1 text-[11px] px-2.5"
                              disabled={isDispatched}
                              onClick={() => handleRequestResponse(fu)}
                            >
                              {isDispatched ? (
                                <>
                                  <Check className="h-3 w-3 text-success-muted-foreground" />
                                  <span>Requested</span>
                                </>
                              ) : (
                                <>
                                  <Send className="h-3 w-3" />
                                  <span>Request PROMs</span>
                                </>
                              )}
                            </Button>
                          )}
                          <Link href={`/patients/${fu.patient.id}/follow-ups`}>
                            <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px] px-2">
                              <span>Record</span>
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Industry Standard Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-muted/75 dark:bg-slate-900/75 border-t border-border dark:border-slate-800 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-foreground dark:text-white">{totalRecords === 0 ? 0 : startIndex + 1}</strong> to{' '}
              <strong className="text-foreground dark:text-white">{Math.min(startIndex + pageSize, totalRecords)}</strong> of{' '}
              <strong className="text-foreground dark:text-white">{totalRecords.toLocaleString()}</strong> records
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={currentPage <= 1}
              onClick={() => setPage(1)}
              title="First Page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              title="Previous Page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            <span className="px-2 text-xs font-mono font-medium text-foreground dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              title="Next Page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(totalPages)}
              title="Last Page"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FollowUpStatus({ status }: { status: string }) {
  return <Badge variant="outline">{status}</Badge>;
}

export function FollowUpMissingData() {
  return null;
}
