import { defineConfig } from '@playwright/test';
import base from './playwright.config';

/** So a galeria de arte: precisa apenas do Vite, sem backend nem Docker. */
export default defineConfig({
  ...base,
  testMatch: 'art.spec.ts',
  testIgnore: [],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
