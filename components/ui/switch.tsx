'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

/**
 * Accessible toggle switch built on a native checkbox input, so it is
 * keyboard-operable and announced correctly by assistive tech.
 */
const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, id, ...props }, ref) => {
    const generated = React.useId();
    const inputId = id ?? generated;
    return (
      <span className="inline-flex items-center gap-2.5">
        <span className="relative inline-flex">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            role="switch"
            className={cn(
              'peer h-5 w-9 cursor-pointer appearance-none rounded-full bg-input shadow-inner transition-colors checked:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
            {...props}
          />
          <span className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform peer-checked:translate-x-4" />
        </span>
        {label && (
          <label htmlFor={inputId} className="cursor-pointer text-sm font-medium text-foreground">
            {label}
          </label>
        )}
      </span>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };
