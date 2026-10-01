import { type APIRequestContext, type Page, expect, test } from '@playwright/test';
import type Phaser from 'phaser';
import type { Monster, Roster } from '../src/api/types';

declare global {
  interface Window {
    __clonemon?: { game: Phaser.Game };
  }
}

function isActive(page: Page, key: string): Promise<boolean> {
  return page.evaluate((k) => window.__clonemon?.game.scene.isActive(k) ?? false, key);
}

async function waitForScene(page: Page, key: string, timeout = 20_000): Promise<void> {
  await page.waitForFunction((k) => window.__clonemon?.game.scene.isActive(k), key, { timeout });
}

/** Aperta Enter (com folga para o jogo processar) enquanto a cena estiver ativa. */
async function pressWhileIn(page: Page, scene: string, maxPresses: number): Promise<void> {
  for (let i = 0; i < maxPresses && (await isActive(page, scene)); i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(120);
  }
}

async function shot(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(300);
  await page.screenshot({ path: `test-results/screens/${name}.png` });
}

function authed(request: APIRequestContext, token: string) {
  const headers = { Authorization: `Bearer ${token}` };
  return {
    roster: async (): Promise<Roster> => (await request.get('/api/team', { headers })).json(),
    activeBattleStatus: async () => (await request.get('/api/battles/active', { headers })).status(),
  };
}

test('new trainer picks a starter, battles, and progress survives a reload', async ({ page, request }) => {
  await page.goto('/');
  await waitForScene(page, 'Title');
  await shot(page, '01-title');
  await page.keyboard.press('Enter');

  await waitForScene(page, 'Login');
  await expect(page.locator('#login')).toBeVisible();
  await shot(page, '02-login');
  await page.fill('#username', `e2e_${Date.now().toString(36)}`);
  await page.fill('#password', 'segredo123');
  await page.click('#btn-register');

  await waitForScene(page, 'Starter');
  await expect(page.locator('#login')).toBeHidden();
  await page.keyboard.press('ArrowRight'); // Coiso
  await page.waitForTimeout(150);
  await shot(page, '03-starter');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  await page.keyboard.press('Enter'); // SIM
  await pressWhileIn(page, 'Starter', 20);

  await waitForScene(page, 'Hub');
  const token = await page.evaluate(() => localStorage.getItem('clonemon.token'));
  expect(token).toBeTruthy();
  const api = authed(request, token!);
  const before: Monster = (await api.roster()).team[0];
  expect(before.species).toBe('Coiso');
  expect(before.level).toBe(5);
  await shot(page, '04-hub');

  await page.keyboard.press('Enter'); // LUTAR
  await waitForScene(page, 'Battle');
  await shot(page, '05-battle-intro');
  await pressWhileIn(page, 'Battle', 4);
  await shot(page, '06-battle-menu');
  await pressWhileIn(page, 'Battle', 1);
  await shot(page, '07-battle-moves');
  await pressWhileIn(page, 'Battle', 3);
  await shot(page, '08-battle-turn');
  await pressWhileIn(page, 'Battle', 400);

  await waitForScene(page, 'Hub');
  expect(await api.activeBattleStatus()).toBe(404);
  const after = await api.roster();
  const lead = after.team.find((m) => m.id === before.id)!;
  expect(lead.xp !== before.xp || lead.currentHp !== before.currentHp).toBe(true);
  await shot(page, '09-hub-after-battle');

  // Recarregar: o jogo volta logado e mostra exatamente o que esta salvo no servidor.
  await page.reload();
  await waitForScene(page, 'Title');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Hub');
  await page.waitForFunction(() => {
    const hub = window.__clonemon?.game.scene.getScene('Hub') as unknown as { roster: Roster | null };
    return hub.roster !== null;
  });
  const shown = await page.evaluate(
    () => (window.__clonemon!.game.scene.getScene('Hub') as unknown as { roster: Roster }).roster,
  );
  expect(shown).toEqual(after);
});

test('wrong password shows an error on the login form', async ({ page }) => {
  await page.goto('/');
  await waitForScene(page, 'Title');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Login');
  await page.fill('#username', 'ninguem_aqui');
  await page.fill('#password', 'errada123');
  await page.click('#btn-login');
  await expect(page.locator('#login-error')).toHaveText('Treinador ou senha invalidos.');
  expect(await isActive(page, 'Login')).toBe(true);
});
