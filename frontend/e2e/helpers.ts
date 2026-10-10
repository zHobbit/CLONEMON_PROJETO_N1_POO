import type { APIRequestContext, Page } from '@playwright/test';
import type Phaser from 'phaser';
import type { Roster, WorldPosition, WorldState } from '../src/api/types';

declare global {
  interface Window {
    __clonemon?: { game: Phaser.Game };
  }
}

/** O que a cena do mapa expoe para os testes. */
export interface WorldView {
  position: WorldPosition | null;
  roster: Roster | null;
  idle: boolean;
}

export function isActive(page: Page, key: string): Promise<boolean> {
  return page.evaluate((k) => window.__clonemon?.game.scene.isActive(k) ?? false, key);
}

export async function waitForScene(page: Page, key: string, timeout = 20_000): Promise<void> {
  await page.waitForFunction((k) => window.__clonemon?.game.scene.isActive(k), key, { timeout });
}

/** Aperta Enter (com folga para o jogo processar) enquanto a cena estiver ativa. */
export async function pressWhileIn(page: Page, scene: string, maxPresses: number): Promise<void> {
  for (let i = 0; i < maxPresses && (await isActive(page, scene)); i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(120);
  }
}

export async function shot(page: Page, name: string): Promise<void> {
  await page.waitForTimeout(300);
  await page.screenshot({ path: `test-results/screens/${name}.png` });
}

export function worldView(page: Page): Promise<WorldView> {
  return page.evaluate(() => {
    const w = window.__clonemon!.game.scene.getScene('World') as unknown as WorldView;
    return { position: w.position, roster: w.roster, idle: w.idle };
  });
}

/** Espera o mapa carregar e o jogador ficar livre. */
export async function waitForIdle(page: Page, timeout = 20_000): Promise<void> {
  await page.waitForFunction(
    () => window.__clonemon?.game.scene.isActive('World') && (window.__clonemon.game.scene.getScene('World') as unknown as WorldView).idle,
    null,
    { timeout },
  );
}

/** Avanca dialogos do mapa com Enter ate o jogador ficar livre (sem abrir o menu de pausa). */
export async function pressUntilIdle(page: Page, maxPresses = 15): Promise<void> {
  for (let i = 0; i < maxPresses && !(await worldView(page)).idle; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
  }
  await waitForIdle(page);
}

/**
 * Segura a seta ate a coordenada passar do valor (o passo em andamento termina depois de soltar,
 * entao pode andar um ladrilho a mais) ou ate uma batalha comecar.
 */
export async function holdUntil(page: Page, key: string, axis: 'x' | 'y', op: '<=' | '>=', value: number, timeout = 20_000): Promise<void> {
  await page.keyboard.down(key);
  try {
    await page.waitForFunction(
      ([a, o, v]) => {
        const game = window.__clonemon!.game;
        if (game.scene.isActive('Battle')) return true;
        const p = (game.scene.getScene('World') as unknown as WorldView).position;
        return p !== null && (o === '<=' ? p[a] <= v : p[a] >= v);
      },
      [axis, op, value] as const,
      { timeout },
    );
  } finally {
    await page.keyboard.up(key);
  }
}

/** Um passo so: segura menos que a duracao de um passo (o suficiente para virar e sair). */
export async function stepOnce(page: Page, key: string, expected: Partial<WorldPosition>): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForTimeout(140);
  await page.keyboard.up(key);
  await page.waitForFunction(
    (e) => {
      const w = window.__clonemon!.game.scene.getScene('World') as unknown as WorldView;
      return w.idle && Object.entries(e).every(([k, v]) => w.position?.[k as keyof WorldPosition] === v);
    },
    expected,
    { timeout: 5_000 },
  );
}

/** Textos visiveis de uma cena (o canvas nao tem DOM), com quebras de linha e espacos repetidos virando um espaco. */
export function sceneTexts(page: Page, key: string): Promise<string[]> {
  return page.evaluate((k) => {
    const scene = window.__clonemon!.game.scene.getScene(k);
    return scene.children.list
      .filter((o): o is Phaser.GameObjects.Text => o.type === 'Text' && (o as Phaser.GameObjects.Text).visible)
      .map((t) => t.text.replace(/\s+/g, ' '));
  }, key);
}

export async function waitForText(page: Page, key: string, text: string, timeout = 10_000): Promise<void> {
  await page.waitForFunction(
    ([k, s]) => {
      const scene = window.__clonemon?.game.scene.getScene(k);
      return scene?.children.list.some(
        (o) => o.type === 'Text' && (o as Phaser.GameObjects.Text).visible && (o as Phaser.GameObjects.Text).text.replace(/\s+/g, ' ').includes(s),
      );
    },
    [key, text] as const,
    { timeout },
  );
}

export function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

/** Treinador novo, criado direto pela API, ja com o inicial escolhido. Devolve o token. */
export async function newTrainer(request: APIRequestContext, speciesId = 2): Promise<string> {
  const username = `w_${Date.now().toString(36)}${Math.floor(Math.random() * 100)}`;
  const res = await request.post('/api/auth/register', { data: { username, password: 'segredo123' } });
  const { token } = (await res.json()) as { token: string };
  await request.post('/api/team/starter', { headers: authHeaders(token), data: { speciesId } });
  return token;
}

/**
 * Simula GET /api/world e PUT /api/world/position no navegador. `state` e lido a cada GET;
 * cada PUT vai para `saved` e passa a ser a posicao devolvida.
 */
export async function mockWorld(page: Page, state: () => WorldState, saved: WorldPosition[] = []): Promise<WorldPosition[]> {
  let last: WorldPosition | null = null;
  await page.route('**/api/world**', async (route) => {
    const req = route.request();
    if (req.method() === 'PUT') {
      last = req.postDataJSON() as WorldPosition;
      saved.push(last);
      await route.fulfill({ status: 204 });
    } else {
      const s = state();
      await route.fulfill({ json: { ...s, position: last ?? s.position } });
    }
  });
  return saved;
}
