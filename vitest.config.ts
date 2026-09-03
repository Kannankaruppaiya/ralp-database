import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(process.cwd(), '.'),
      // server/** guards itself with `import 'server-only'`, which throws outside
      // a React Server Component. Stub it so the same modules the app runs can be
      // exercised directly in a plain Node test process.
      'server-only': resolve(process.cwd(), 'test/stubs/empty.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
