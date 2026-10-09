import { defineConfig } from '@playwright/test';

const win = process.platform === 'win32';
const backend = win
  ? 'backend\\mvnw.cmd -q -f backend\\pom.xml spring-boot:test-run -Dspring-boot.run.main-class=br.clonemon.TestClonemonApplication'
  : './backend/mvnw -q -f backend/pom.xml spring-boot:test-run -Dspring-boot.run.main-class=br.clonemon.TestClonemonApplication';

/**
 * E2E contra o jogo de verdade: backend com Postgres via Testcontainers (precisa do Docker)
 * e o servidor do Vite. Reaproveita servidores ja rodando fora da CI.
 * No Windows usa o Edge instalado, sem baixar navegadores.
 */
export default defineConfig({
  testDir: 'e2e',
  testIgnore: 'art.spec.ts',
  timeout: 180_000,
  outputDir: 'test-results',
  use: {
    baseURL: 'http://localhost:5173',
    channel: process.env.PW_CHANNEL ?? (win ? 'msedge' : undefined),
    viewport: { width: 960, height: 640 },
  },
  webServer: [
    {
      command: backend,
      cwd: '..',
      url: 'http://localhost:8081/api/species',
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
