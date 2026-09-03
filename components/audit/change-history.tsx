'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AuditLogEntry } from '@/types/audit';
import { formatDateTime } from '@/lib/date';
import { History, ShieldCheck, UserCheck, FileEdit, Database } from 'lucide-react';

export function ChangeHistory({
  events,
  onSelectEvent,
}: {
  events: AuditLogEntry[];
  onSelectEvent?: (event: AuditLogEntry) => void;
}) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm dark:border-[#272727] dark:bg-[#181818]">
      <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-[#272727] flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 dark:border dark:border-indigo-900/60">
            <History className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Governance Activity Stream
            </CardTitle>
            <p className="text-[11px] text-slate-500 font-medium">Real-time Caldicott audit events</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-slate-400 [font-variant-numeric:tabular-nums]">
          {events.length} Recent Logs
        </span>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {events.length === 0 ? (
          <p className="text-center py-6 text-xs text-slate-500">No recent governance events recorded.</p>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-[#272727]">
            {events.slice(0, 8).map((event) => (
              <div
                key={event.id}
                onClick={() => onSelectEvent?.(event)}
                className="relative group cursor-pointer"
              >
                <div className="absolute -left-6 top-1.5 h-2 w-2 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-[#181818] group-hover:scale-125 transition-transform" />
                <div className="p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#121212] border border-slate-200 dark:border-[#272727] group-hover:border-indigo-500/50 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{event.userName}</span>
                      <Badge variant="info" className="text-[9px] font-mono">
                        {event.action}
                      </Badge>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 [font-variant-numeric:tabular-nums]">
                      {formatDateTime(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 [text-wrap:pretty]">
                    {event.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
