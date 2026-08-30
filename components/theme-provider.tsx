'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * App-wide light/dark/system theme.
 *
 * Adds `class="dark"` to <html> so the 600+ `dark:` variants and the dark
 * token block in globals.css actually apply. The clinician, patient and admin
 * shells all read from this; the auth screens keep their own dark styling.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
