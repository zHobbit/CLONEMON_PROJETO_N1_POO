import { type Page, expect, test } from '@playwright/test';
import type Phaser from 'phaser';
import type { Battle, Combatant, Monster, Roster, TurnEvent, TurnResponse, WorldPosition, WorldState } from '../src/api/types';
import {
  authHeaders,
  mockWorld,
  newTrainer,
  pressUntilIdle,
  pressWhileIn,
  sceneTexts,
  shot,
  stepOnce,
  waitForIdle,
  waitForScene,
  waitForText,
  worldView,
} from './helpers';

/**
 * O mapa com /api/world e as batalhas contra treinadores simulados na pagina (rodam sem o backend novo);
 * login, time e cura usam o backend de verdade.
 */

const BATTLE_ID = 9191;

function combatant(partial: Partial<Combatant>): Combatant {
  return {
    monsterId: null, speciesId: 3, name: 'Lucifer', element: 'FOGO', level: 6, currentHp: 22, maxHp: 22,
    fainted: false, status: 'NONE', moves: null, ...partial,
  };
}

function playerSide(lead: Monster): Combatant {
  return combatant({
    monsterId: lead.id, speciesId: lead.speciesId, name: lead.species, element: lead.element, level: lead.level,
    currentHp: lead.currentHp, maxHp: lead.maxHp, moves: lead.moves,
  });
}

/** CAIO com dois monstros: Lucifer e depois Olaf. */
function caioBattle(lead: Monster): Battle {
  return {
    id: BATTLE_ID, status: 'AWAITING_ACTION', playerActive: 0, playerTeam: [playerSide(lead)],
    enemy: combatant({}), log: [], npcId: 'caio', npcName: 'CAIO', enemyTeamSize: 2, enemyActive: 0,
  };
}

function turns(lead: Monster): TurnResponse[] {
  const start = caioBattle(lead);
  const ev = (text: string, effect: TurnEvent['effect'], enemyHp: number): TurnEvent => ({
    text, effect, enemyHp, playerActive: 0, playerHp: lead.currentHp, playerStatus: 'NONE', enemyStatus: 'NONE',
  });
  const olaf = combatant({ speciesId: 4, name: 'Olaf', element: 'GELO', currentHp: 20, maxHp: 20 });
  const second: Battle = { ...start, enemy: olaf, enemyActive: 1 };
  return [
    {
      events: [
        ev(`${lead.species} usou ${lead.moves[0].name}!`, 'ENEMY_HIT', 0),
        ev('Lucifer desmaiou!', 'ENEMY_FAINT', 0),
        ev('CAIO enviou Olaf!', 'ENEMY_SWITCH', 20),
      ],
      battle: second,
    },
    {
      events: [
        ev(`${lead.species} usou ${lead.moves[0].name}!`, 'ENEMY_HIT', 0),
        ev('Olaf desmaiou!', 'ENEMY_FAINT', 0),
        ev('Voce derrotou CAIO!', 'WON', 0),
      ],
      battle: { ...second, status: 'PLAYER_WON', enemy: { ...olaf, currentHp: 0, fainted: true } },
    },
  ];
}

/** Entra logado (token direto no localStorage) e espera o mapa ficar livre. */
async function enterWorld(page: Page, token: string): Promise<void> {
  await page.addInitScript((t) => localStorage.setItem('clonemon.token', t), token);
  await page.goto('/');
  await waitForScene(page, 'Title');
  await page.keyboard.press('Enter');
  await waitForScene(page, 'World');
  await waitForIdle(page);
}

function hasExclaim(page: Page): Promise<boolean> {
  return page.evaluate(() =>
    window.__clonemon!.game.scene.getScene('World').children.list.some(
      (o) => (o as unknown as { texture?: { key: string } }).texture?.key === 'world-exclaim',
    ),
  );
}

test('a trainer spots the player, battles without FUGIR and remembers the defeat', async ({ page, request }) => {
  const token = await newTrainer(request);
  const roster = (await (await request.get('/api/team', { headers: authHeaders(token) })).json()) as Roster;
  const lead = roster.team[0];
  const defeated: string[] = [];
  // Uma linha abaixo da visao do CAIO (que olha para a direita na linha 14).
  const start: WorldPosition = { x: 19, y: 15, facing: 'UP' };
  const saved = await mockWorld(page, (): WorldState => ({ position: start, defeatedNpcs: defeated }));

  let battleBody: unknown = 'none';
  await page.route('**/api/battles', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    battleBody = route.request().postDataJSON();
    await route.fulfill({ json: caioBattle(lead) });
  });
  const responses = turns(lead);
  let turn = 0;
  await page.route(`**/api/battles/${BATTLE_ID}/turns`, async (route) => {
    const res = responses[Math.min(turn++, responses.length - 1)];
    if (res.battle.status === 'PLAYER_WON') defeated.push('caio');
    await route.fulfill({ json: res });
  });

  await enterWorld(page, token);
  expect((await worldView(page)).position).toEqual(start);

  // Um passo para cima entra na linha de visao: "!", o CAIO vem ate o jogador e desafia.
  await page.keyboard.down('ArrowUp');
  await expect.poll(() => hasExclaim(page), { timeout: 5_000 }).toBe(true);
  await page.keyboard.up('ArrowUp');
  await shot(page, 'world-npc-exclaim');
  await waitForText(page, 'World', 'Ninguem passa pela ROTA 1');
  expect((await worldView(page)).position).toEqual({ x: 19, y: 14, facing: 'LEFT' });
  await shot(page, 'world-npc-challenge');
  await pressWhileIn(page, 'World', 10);

  await waitForScene(page, 'Battle');
  expect(battleBody).toEqual({ npcId: 'caio' });
  expect(saved.at(-1)).toEqual({ x: 19, y: 14, facing: 'LEFT' });
  await waitForText(page, 'Battle', 'CAIO quer batalhar!');
  await page.keyboard.press('Enter');
  await waitForText(page, 'Battle', 'CAIO enviou LUCIFER!');
  await shot(page, 'battle-trainer-intro');
  for (let i = 0; i < 6 && !(await sceneTexts(page, 'Battle')).includes('LUTAR'); i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
  }
  // Contra treinador nao da para fugir: a opcao fica apagada.
  const fugir = await page.evaluate(() => {
    const t = window.__clonemon!.game.scene.getScene('Battle').children.list.find(
      (o) => o.type === 'Text' && (o as Phaser.GameObjects.Text).text === 'FUGIR',
    ) as Phaser.GameObjects.Text;
    return String(t.style.color);
  });
  expect(fugir.toLowerCase()).toBe('#8b9bb4');
  await shot(page, 'battle-trainer-menu');

  // Turno 1: o primeiro monstro cai e o CAIO manda o segundo.
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  await page.keyboard.press('Enter');
  for (let i = 0; i < 40 && !(await sceneTexts(page, 'Battle')).some((t) => t.includes('CAIO enviou Olaf!')); i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
  }
  await waitForText(page, 'Battle', 'OLAF');
  await shot(page, 'battle-trainer-switch');
  await pressWhileIn(page, 'Battle', 60);

  // De volta ao mapa: o CAIO ficou onde parou e agora so conversa.
  await waitForScene(page, 'World');
  await waitForIdle(page);
  expect(turn).toBe(2);
  expect((await worldView(page)).position).toEqual({ x: 19, y: 14, facing: 'LEFT' });
  await page.keyboard.press('Enter');
  await waitForText(page, 'World', 'Voce e bom mesmo...');
  await shot(page, 'world-npc-defeated');
  await pressUntilIdle(page);
  expect(await page.evaluate(() => window.__clonemon!.game.scene.isActive('Battle'))).toBe(false);
});

test('signs, the pause menu and healing at the Centro', async ({ page, request }) => {
  const token = await newTrainer(request);
  const saved = await mockWorld(page, () => ({ position: { x: 11, y: 25, facing: 'UP' }, defeatedNpcs: [] }));
  await enterWorld(page, token);
  await shot(page, 'world-town');

  // Placa do Centro, logo a frente.
  await page.keyboard.press('Enter');
  await waitForText(page, 'World', 'CENTRO CLONEMON');
  await shot(page, 'world-sign');
  await pressUntilIdle(page);

  // Esc abre o menu de pausa (TIME e SAIR); Esc de novo fecha.
  await page.keyboard.press('Escape');
  await waitForText(page, 'World', 'SAIR');
  expect(await sceneTexts(page, 'World')).toEqual(expect.arrayContaining(['TIME', 'SAIR']));
  await shot(page, 'world-pause');
  await page.keyboard.press('Escape');
  await waitForIdle(page);
  expect(await sceneTexts(page, 'World')).not.toContain('SAIR');

  // Tres passos ate a porta do Centro e para cima: entra, cura e sai olhando para baixo.
  await stepOnce(page, 'ArrowLeft', { x: 10 });
  await stepOnce(page, 'ArrowLeft', { x: 9 });
  await stepOnce(page, 'ArrowLeft', { x: 8 });
  const heal = page.waitForRequest((r) => r.url().endsWith('/api/team/heal') && r.method() === 'POST');
  await page.keyboard.down('ArrowUp');
  await waitForText(page, 'World', 'Bem-vindo ao CENTRO CLONEMON!');
  await page.keyboard.up('ArrowUp');
  await shot(page, 'world-centro');
  await pressUntilIdle(page, 30);
  await heal;
  expect((await worldView(page)).position).toEqual({ x: 8, y: 25, facing: 'DOWN' });
  await expect.poll(() => saved.at(-1)).toEqual({ x: 8, y: 25, facing: 'DOWN' });
});

test('tall grass is drawn over the legs of the player', async ({ page, request }) => {
  const token = await newTrainer(request);
  await mockWorld(page, () => ({ position: { x: 25, y: 16, facing: 'DOWN' }, defeatedNpcs: [] }));
  await enterWorld(page, token);
  const front = await page.evaluate(() => {
    const scene = window.__clonemon!.game.scene.getScene('World');
    const layer = scene.children.list.find((o) => (o as unknown as Phaser.Tilemaps.TilemapLayer).layer?.name === 'front') as unknown as Phaser.Tilemaps.TilemapLayer;
    return layer.getTileAt(25, 16)?.index ?? null;
  });
  expect(front).toBe(11);
  await shot(page, 'world-tall-grass');
});
