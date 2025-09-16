/// <reference types='vitest' />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    name: 'backend-niv-e2e',
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8',
    },
  },
});
