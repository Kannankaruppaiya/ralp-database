import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Initials/label avatar. No external image loading — clinical avatars are
 * initials (surgeon codes, staff), which keeps it dependency-free and PII-safe.
 */
export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  initials: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
};

const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ className, initials, size = 'md', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex select-none items-center justify-center rounded-full bg-primary font-bold text-primary-foreground shadow-sm',
        SIZES[size],
        className
      )}
      {...props}
    >
      {initials}
    </span>
  )
);
Avatar.displayName = 'Avatar';

export { Avatar };
