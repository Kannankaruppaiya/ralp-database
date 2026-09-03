import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#121212] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-teal-600 text-white shadow-sm hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700',
        destructive:
          'bg-rose-600 text-white shadow-sm hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700',
        outline:
          'border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 dark:border-[#272727] dark:bg-[#181818] dark:text-slate-200 dark:hover:bg-[#1F1F1F]',
        secondary:
          'bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-200/80 dark:bg-[#1F1F1F] dark:text-slate-100 dark:hover:bg-[#272727]',
        ghost:
          'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#1F1F1F] dark:hover:text-slate-100',
        link: 'text-teal-600 underline-offset-4 hover:underline dark:text-teal-400',
        clinical:
          'bg-slate-900 text-white hover:bg-slate-800 shadow-sm dark:bg-[#FAFAFA] dark:text-slate-900 dark:hover:bg-white',
      },
      size: {
        default: 'h-9 px-3.5 py-2 text-sm',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-lg px-4 py-2 text-base font-semibold min-h-[44px]',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
