import { type APIRequestContext, type Page, expect, test } from '@playwright/test';
import type { Battle, Monster, Roster, WorldPosition } from '../src/api/types';
import {
  authHeaders,
  holdUntil,
  isActive,
  mockWorld,
  pressUntilIdle,
  pressWhileIn,
  shot,
  waitForIdle,
  waitForScene,
  worldView,
} from './helpers';

function authed(request: APIRequestContext, token: string) {
  const headers = authHeaders(token);
  return {
    roster: async (): Promise<Roster> => (await request.get('/api/team', { headers })).json(),
    activeBattleStatus: async () => (await request.get('/api/battles/active', { headers })).status(),
  };
}

/**
 * Posicao salva no servidor. Se o backend ainda nao tiver /api/world, o teste guarda a posicao
 * em memoria (mock na pagina) e confere por ali.
 */
async function savedPosition(page: Page, request: APIRequestContext, token: string): Promise<() => Promise<WorldPosition | null>> {
  const res = await request.get('/api/world', { headers: authHeaders(token) });
  if (res.ok()) {
    return async () => ((await (await request.get('/api/world', { headers: authHeaders(token) })).json()) as { position: WorldPosition | null }).position;
  }
  const saved = await mockWorld(page, () => ({ position: null, defeatedNpcs: [] }));
  return async () => saved.at(-1) ?? null;
}

test('new trainer walks into tall grass, battles, and the position survives a reload', async ({ page, request }) => {
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
  const token = await page.evaluate(() => localStorage.getItem('clonemon.token'));
  expect(token).toBeTruthy();
  const api = authed(request, token!);
  const saved = await savedPosition(page, request, token!);

  await page.keyboard.press('ArrowRight'); // Coiso
  await page.waitForTimeout(150);
  await shot(page, '03-starter');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  await page.keyboard.press('Enter'); // SIM
  await pressWhileIn(page, 'Starter', 20);

  // O mapa substitui o antigo menu: o jogador comeca na porta de casa.
  await waitForScene(page, 'World');
  await waitForIdle(page);
  const before: Monster = (await api.roster()).team[0];
  expect(before.species).toBe('Coiso');
  expect(before.level).toBe(5);
  expect((await worldView(page)).position).toEqual({ x: 25, y: 24, facing: 'DOWN' });
  await shot(page, '04-world-spawn');

  // Ate a estrada, subindo pela entrada da Rota 1, e depois para o capim alto da direita.
  await holdUntil(page, 'ArrowLeft', 'x', '<=', 20);
  await holdUntil(page, 'ArrowUp', 'y', '<=', 17);
  await holdUntil(page, 'ArrowRight', 'x', '>=', 23);
  if (!(await isActive(page, 'Battle'))) await shot(page, '05-world-tall-grass');
  // Anda de um lado para o outro no capim ate um CLONEMON selvagem aparecer (12% por passo).
  for (let i = 0; i < 40 && !(await isActive(page, 'Battle')); i++) {
    const right = i % 2 === 0;
    await holdUntil(page, right ? 'ArrowRight' : 'ArrowLeft', 'x', right ? '>=' : '<=', right ? 30 : 23);
  }

  await waitForScene(page, 'Battle');
  const grassSpot = (await worldView(page)).position!;
  expect([15, 16, 17]).toContain(grassSpot.y);
  await shot(page, '06-battle-intro');
  await pressWhileIn(page, 'Battle', 4);
  await shot(page, '07-battle-menu');
  await pressWhileIn(page, 'Battle', 1);
  await shot(page, '08-battle-moves');
  await pressWhileIn(page, 'Battle', 400);

  // De volta ao mapa: no capim se venceu, na porta do Centro (e curado) se perdeu.
  await waitForScene(page, 'World');
  await pressUntilIdle(page);
  expect(await api.activeBattleStatus()).toBe(404);
  const status = await page.evaluate(
    () => (window.__clonemon!.game.scene.getScene('Battle') as unknown as { battle: Battle }).battle.status,
  );
  const after = await api.roster();
  const lead = after.team.find((m) => m.id === before.id)!;
  const back = (await worldView(page)).position!;
  if (status === 'PLAYER_LOST') {
    expect(back).toEqual({ x: 8, y: 25, facing: 'DOWN' });
    expect(lead.currentHp).toBe(lead.maxHp);
  } else {
    expect(status).toBe('PLAYER_WON');
    expect(back).toEqual(grassSpot);
    expect(lead.xp !== before.xp || lead.level !== before.level).toBe(true);
  }
  await shot(page, '09-world-after-battle');
  await expect.poll(saved).toEqual(back);

  // Recarregar: o jogo volta logado, no mesmo lugar e com o time salvo no servidor.
  await page.reload();
  await waitForScene(page, 'Title');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'World');
  await waitForIdle(page);
  const shown = await worldView(page);
  expect(shown.position).toEqual(back);
  expect(shown.roster).toEqual(after);
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
