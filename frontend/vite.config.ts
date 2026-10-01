import { defineConfig } from 'vitest/config';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': process.env.API_TARGET ?? 'http://localhost:8081',
    },
  },
  build: {
    // O Phaser sozinho tem ~1.2 MB minificado.
    chunkSizeWarningLimit: 1600,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
