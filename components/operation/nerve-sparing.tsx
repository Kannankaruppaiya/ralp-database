import React from 'react';
import { NerveSparingSide, NerveSparingGrade } from '@/types/operation';
import { Badge } from '@/components/ui/badge';

export function NerveSparingDisplay({
  side,
  leftGrade,
  rightGrade,
}: {
  side?: NerveSparingSide;
  leftGrade?: NerveSparingGrade;
  rightGrade?: NerveSparingGrade;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="outline" className="font-semibold">
        {side || 'Not recorded'}
      </Badge>
      {side === 'Bilateral' && (
        <span className="text-xs text-muted-foreground">
          (L: {leftGrade || '5/5'} | R: {rightGrade || '5/5'})
        </span>
      )}
    </div>
  );
}
