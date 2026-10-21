import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['server/tests/**/*.test.js'],
    testTimeout: 15000,
    hookTimeout: 15000,
    fileParallelism: false,
  },
});
