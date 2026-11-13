import { defineConfig } from 'vitest/config';

// Fast tests: the answer-checking engine and the content files. No internet or Firebase needed.
export default defineConfig({
  test: { include: ['tests/**/*.test.{js,ts}'], exclude: ['tests/rules/**'] },
});
