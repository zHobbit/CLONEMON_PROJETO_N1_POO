import { expect, test } from '@playwright/test';

/** Renderiza a galeria de arte (/art.html) e salva um print para revisao. */
test('art gallery renders every sprite without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1500, height: 1800 });
  await page.goto('/art.html');
  await page.locator('#gallery').screenshot({ path: 'test-results/screens/art-gallery.png' });
  expect(errors).toEqual([]);
});
