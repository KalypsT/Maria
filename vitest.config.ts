import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: { __DEBUG_TOOLS__: 'false', __APP_VERSION__: '"test"' },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Large : les analyses tournent en parallèle sur la CI (voir tests/timeouts.ts).
    testTimeout: 1_800_000,
  },
});
