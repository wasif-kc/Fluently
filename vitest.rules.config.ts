import { defineConfig } from 'vitest/config';

// Security-rules tests. Run with `npm run test:rules` (starts the Firestore emulator).
export default defineConfig({
  test: { include: ['tests/rules/**/*.test.ts'], testTimeout: 20000 },
});
