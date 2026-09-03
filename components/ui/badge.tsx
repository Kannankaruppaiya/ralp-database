import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-normal transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-teal-600 text-white shadow-sm hover:bg-teal-700 dark:bg-teal-600',
        secondary:
          'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-[#272727] dark:bg-[#1F1F1F] dark:text-slate-300',
        destructive:
          'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300',
        outline:
          'border-slate-200 text-slate-700 bg-white dark:border-[#272727] dark:text-slate-300 dark:bg-[#181818]',
        success:
          'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300',
        warning:
          'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-300',
        info:
          'border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-900/60 dark:bg-cyan-950/50 dark:text-cyan-300',
        purple:
          'border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-900/60 dark:bg-purple-950/50 dark:text-purple-300',
        r0:
          'border-emerald-300 bg-emerald-50 text-emerald-800 font-bold dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
        r1:
          'border-rose-300 bg-rose-50 text-rose-800 font-bold dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

function Badge({ className, variant, icon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}

export { Badge, badgeVariants };
