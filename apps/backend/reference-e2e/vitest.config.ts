/// <reference types='vitest' />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    name: 'backend-reference-e2e',
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['./src/test-setup.ts'], // <- This line is key
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8',
    },
  },
});
