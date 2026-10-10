import { expect, test } from '@playwright/test';

/** Renderiza a galeria de arte (/art.html) e salva um print para revisao. */
test('art gallery renders every sprite without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1500, height: 1800 });
  await page.goto('/art.html');
  await page.locator('#gallery').screenshot({ path: 'test-results/screens/art-gallery.png' });
  // Recorte so da secao do mapa de exploracao (rodape da galeria), para revisar sem reduzir a imagem.
  const gallery = page.locator('#gallery');
  const worldY = Number(await gallery.getAttribute('data-world-y'));
  const box = (await gallery.boundingBox())!;
  await page.screenshot({
    path: 'test-results/screens/art-world.png',
    fullPage: true,
    clip: { x: box.x, y: box.y + worldY - 24, width: box.width, height: box.height - worldY + 24 },
  });
  expect(errors).toEqual([]);
});
