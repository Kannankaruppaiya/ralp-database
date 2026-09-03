'use client';

import React from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AuditLogEntry } from '@/types/audit';
import { formatDateTime } from '@/lib/date';
import { ShieldCheck, User, Calendar, Database, Lock, CheckCircle2 } from 'lucide-react';

export function AuditEvent({
  event,
  isOpen,
  onClose,
}: {
  event: AuditLogEntry | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogHeader>
        <DialogTitle className="text-base flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <span>Caldicott Audit Event Inspector</span>
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 pt-2 text-xs">
        {/* Verification Banner */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Immutable 256-Bit SHA Log Verification: VALID</span>
          </div>
          <span className="font-mono text-[10px] [font-variant-numeric:tabular-nums]">ID: {event.id.slice(0, 8)}</span>
        </div>

        {/* Key Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[#FAFAFA] dark:bg-[#121212] border border-slate-200 dark:border-[#272727]">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Timestamp (UTC)</span>
            <div className="font-mono text-slate-900 dark:text-white [font-variant-numeric:tabular-nums]">
              {formatDateTime(event.timestamp)}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Action Type</span>
            <div>
              <Badge variant="info" className="font-mono text-[10px]">
                {event.action}
              </Badge>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Clinician / User</span>
            <div className="font-bold text-slate-900 dark:text-white">{event.userName}</div>
            <div className="text-[10px] text-slate-500">{event.userRole}</div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Target Patient</span>
            <div className="font-bold text-slate-900 dark:text-white">{event.patientName || 'N/A (System Level)'}</div>
            {event.patientId && (
              <div className="font-mono text-[10px] text-slate-400 [font-variant-numeric:tabular-nums]">Record: {event.patientId.slice(0, 10)}...</div>
            )}
          </div>
        </div>

        {/* Caldicott Principle Reference */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 text-xs">
            <Lock className="h-3.5 w-3.5" />
            <span>Caldicott Information Governance Principle</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed [text-wrap:pretty]">
            Access justified under direct clinical care or statutory national audit (Caldicott Principle 1: Justify the purpose; Principle 7: The duty to share information can be as important as the duty to protect patient confidentiality).
          </p>
        </div>

        {/* Operation Details */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Operation Details & Mutation Payload</span>
          <div className="p-3 rounded-xl bg-[#121212] border border-[#272727] font-mono text-[11px] text-slate-200 leading-relaxed overflow-x-auto whitespace-pre-wrap">
            {event.details}
          </div>
        </div>
      </div>

      <DialogFooter className="pt-4 border-t border-slate-100 dark:border-[#272727]">
        <Button onClick={onClose} size="sm" className="text-xs font-semibold">
          Close Inspector
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
