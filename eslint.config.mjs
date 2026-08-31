import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

/**
 * ESLint flat config. `next/core-web-vitals` brings React, hooks and
 * jsx-a11y (accessibility) rules; `next/typescript` adds the TS rules. The
 * overrides below catch the production-readiness classes we care about.
 */
const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // --- Safety gate: these fail CI. Never ship these. ---
      'no-debugger': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-alert': 'warn',
      // Accessibility is a compliance requirement here, not a nicety.
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',

      // --- Ratchet: a pre-existing backlog. Downgraded to `warn` so linting
      // can be adopted today without a 170-fix blocker; burn these down over
      // time, then promote back to `error` to stop new ones. ---
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'scripts/**',
      'supabase/**',
      'next-env.d.ts',
      'next.config.ts',
      'postcss.config.mjs',
      'tailwind.config.ts',
    ],
  },
];

export default eslintConfig;
