'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';

/**
 * Recharts renders inline SVG and a white tooltip that don't follow CSS `dark:`
 * variants, so chart chrome (grid, axis ticks, tooltip) has to be themed in JS.
 * Returns light values until mounted to avoid a hydration mismatch.
 */
export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === 'dark';

  return {
    dark,
    grid: dark ? '#1e293b' : '#e2e8f0', // slate-800 / slate-200
    axisTick: dark ? '#94a3b8' : '#64748b', // slate-400 / slate-500
    tooltip: {
      background: dark ? '#0f172a' : '#ffffff', // slate-900 / white
      border: `1px solid ${dark ? '#1e293b' : '#e2e8f0'}`,
      borderRadius: 12,
      fontSize: 12,
      color: dark ? '#e2e8f0' : '#0f172a',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    } as React.CSSProperties,
  };
}
