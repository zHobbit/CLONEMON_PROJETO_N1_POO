import { expect, test } from '@playwright/test';

/** Abrir o index.html direto do disco nao roda o jogo (o navegador bloqueia); a pagina explica o que fazer. */
test('opening index.html from disk explains how to start the game', async ({ page }) => {
  const indexHtml = new URL('../index.html', import.meta.url);
  await page.goto(indexHtml.href);
  const hint = page.locator('#boot-hint');
  await expect(hint).toBeVisible();
  await expect(hint).toHaveCSS('opacity', '1', { timeout: 5_000 });
  await expect(hint).toContainText('jogar.cmd');
});

test('the hint is removed when the game loads normally', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__clonemon?.game);
  await expect(page.locator('#boot-hint')).toHaveCount(0);
});
