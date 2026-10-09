import { defineConfig } from '@playwright/test';
import base from './playwright.config';

/** E2E_BASE_URL aponta para um Vite ja no ar (ex.: outra porta); entao nada e iniciado aqui. */
const target = process.env.E2E_BASE_URL;

/** So a galeria de arte: precisa apenas do Vite, sem backend nem Docker. */
export default defineConfig({
  ...base,
  testMatch: 'art.spec.ts',
  testIgnore: [],
  webServer: target ? [] : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
