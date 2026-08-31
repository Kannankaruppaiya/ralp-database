'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Lightweight tooltip. The trigger owns aria-describedby so the label is
 * announced; the bubble shows on hover and keyboard focus (focus-within), so it
 * is reachable without a pointer. No positioning library — CSS places it above.
 */
export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement<Record<string, unknown>>;
  side?: 'top' | 'bottom';
  className?: string;
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const id = React.useId();
  return (
    <span className="group relative inline-flex">
      {React.cloneElement(children, { 'aria-describedby': id } as Record<string, unknown>)}
      <span
        role="tooltip"
        id={id}
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100',
          side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
          className
        )}
      >
        {content}
      </span>
    </span>
  );
}
