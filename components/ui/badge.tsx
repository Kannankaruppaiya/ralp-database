import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-destructive/20 bg-destructive/10 text-destructive',
        outline: 'text-foreground',
        success:
          'border-success/20 bg-success-muted text-success-muted-foreground',
        warning:
          'border-warning/20 bg-warning-muted text-warning-muted-foreground',
        info:
          'border-info/20 bg-info-muted text-info-muted-foreground',
        purple:
          'border-category/20 bg-category-muted text-category-muted-foreground dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
