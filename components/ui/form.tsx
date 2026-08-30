'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * FormField supplies a generated id to its label and control so they are
 * associated for assistive tech without every screen wiring htmlFor/id by hand.
 * Controls (Input/Select/Textarea) read it via useFormFieldId(); a control used
 * outside a FormField gets null and falls back to its own id.
 */
interface FormFieldContextValue {
  id: string;
}
const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

export function useFormFieldId(): string | undefined {
  return React.useContext(FormFieldContext)?.id;
}

export function FormField({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const id = React.useId();
  return (
    <FormFieldContext.Provider value={{ id }}>
      <div className={cn('space-y-1.5', className)} {...props}>
        {children}
      </div>
    </FormFieldContext.Provider>
  );
}

export function FormLabel({ className, htmlFor, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  const fieldId = useFormFieldId();
  return (
    <label
      htmlFor={htmlFor ?? fieldId}
      className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground', className)}
      {...props}
    >
      {children}
    </label>
  );
}

export function FormDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-xs text-muted-foreground', className)} {...props}>{children}</p>;
}

export function FormMessage({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null;
  return <p role="alert" className={cn('text-xs font-medium text-destructive', className)} {...props}>{children}</p>;
}
