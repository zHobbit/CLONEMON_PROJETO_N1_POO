import { expect, test } from '@playwright/test';
import type { Battle, TurnResponse } from '../src/api/types';
import { authHeaders, newTrainer, sceneTexts, shot, waitForIdle, waitForScene } from './helpers';

interface ReplayView { replay: { turnCount: number } | null; turn: number; playing: boolean; perspective: string }

function replayView(page: import('@playwright/test').Page): Promise<ReplayView> {
  return page.evaluate(() => {
    const s = window.__clonemon!.game.scene.getScene('Replay') as unknown as ReplayView;
    return { replay: s.replay ? { turnCount: s.replay.turnCount } : null, turn: s.turn, playing: s.playing, perspective: s.perspective };
  });
}

test('a finished battle can be replayed turn by turn from the pause menu', async ({ page, request }) => {
  // Uma batalha selvagem jogada ate o fim pela API (primeiro golpe sempre).
  const token = await newTrainer(request, 1);
  const headers = authHeaders(token);
  let battle = (await (await request.post('/api/battles', { headers })).json()) as Battle;
  for (let i = 0; i < 60 && battle.status === 'AWAITING_ACTION'; i++) {
    const res = await request.post(`/api/battles/${battle.id}/turns`, { headers, data: { action: 'MOVE', moveIndex: 0 } });
    battle = ((await res.json()) as TurnResponse).battle;
  }
  expect(battle.status).not.toBe('AWAITING_ACTION');

  await page.addInitScript((t) => localStorage.setItem('clonemon.token', t), token);
  await page.goto('/');
  await waitForScene(page, 'Title');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'World');
  await waitForIdle(page);

  // Esc > REPLAYS
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(await sceneTexts(page, 'World')).toEqual(expect.arrayContaining(['TIME', 'REPLAYS', 'SAIR']));
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'Replays');
  await page.waitForFunction(() => (window.__clonemon!.game.scene.getScene('Replays') as unknown as { summaries: unknown[] | null }).summaries?.length === 1);
  await shot(page, 'replay-list');

  await page.keyboard.press('Enter');
  await waitForScene(page, 'Replay');
  await page.waitForFunction(() => (window.__clonemon!.game.scene.getScene('Replay') as unknown as ReplayView).turn >= 1, null, { timeout: 30_000 });
  const total = (await replayView(page)).replay!.turnCount;

  // Pausa, pula para o fim com a seta para a direita e volta um turno.
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await replayView(page)).playing).toBe(false);
  // Uma seta durante a animacao so acelera o turno; repete ate chegar ao fim.
  for (let i = 0; i < total + 10 && (await replayView(page)).turn < total; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
  }
  await expect.poll(async () => (await replayView(page)).turn).toBe(total);
  expect((await sceneTexts(page, 'Replay')).join(' ')).toContain(`TURNO ${total}/${total}`);
  await page.keyboard.press('ArrowLeft');
  await expect.poll(async () => (await replayView(page)).turn).toBe(total - 1);

  // V espelha a arena.
  await page.keyboard.press('v');
  await expect.poll(async () => (await replayView(page)).perspective).toBe('enemy');
  await shot(page, 'replay-mirrored');

  await page.keyboard.press('Escape');
  await waitForScene(page, 'Replays');
});
