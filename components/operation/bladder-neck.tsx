import React from 'react';
import { BladderNeckStatus } from '@/types/operation';
import { Badge } from '@/components/ui/badge';

export function BladderNeckDisplay({ status }: { status?: BladderNeckStatus }) {
  if (!status) return <span className="text-slate-400 italic">—</span>;
  if (status === 'sparing') {
    return <Badge variant="success">Sparing</Badge>;
  }
  if (status === 'slight wide') {
    return <Badge variant="warning">Slight Wide</Badge>;
  }
  return <Badge variant="destructive">Wide Needing Reconstruction</Badge>;
}
