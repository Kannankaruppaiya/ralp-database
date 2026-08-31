'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

/**
 * Accessible checkbox. A native input carries state and keyboard/screen-reader
 * semantics; the visible box is a styled sibling driven by :checked / :focus.
 */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const generated = React.useId();
    const inputId = id ?? generated;
    return (
      <span className="inline-flex items-center gap-2">
        <span className="relative inline-flex">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className="peer h-4 w-4 shrink-0 cursor-pointer appearance-none rounded border border-input bg-transparent shadow-sm checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...props}
          />
          <Check
            className="pointer-events-none absolute left-0 top-0 h-4 w-4 text-primary-foreground opacity-0 peer-checked:opacity-100"
            strokeWidth={3}
            aria-hidden="true"
          />
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
Checkbox.displayName = 'Checkbox';

export { Checkbox };
