'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useFormFieldId } from '@/components/ui/form';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, id, ...props }, ref) => {
    const fieldId = useFormFieldId();
    return (
    <textarea
      ref={ref}
      id={id ?? fieldId}
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-destructive focus-visible:ring-destructive',
        className
      )}
      {...props}
    />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
