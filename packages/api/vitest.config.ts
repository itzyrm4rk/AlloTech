import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Charge le .env à la racine du monorepo (pas dans packages/api/)
  envDir: path.resolve(__dirname, '../../'),
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Timeout allongé à 30s pour les appels API Gemini (latence réseau externe)
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
    },
  },
});
