import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:border-teal-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#272727] dark:bg-[#181818] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus-visible:border-teal-500',
          error && 'border-rose-500 focus-visible:ring-rose-500/50 focus-visible:border-rose-600 dark:border-rose-500',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
