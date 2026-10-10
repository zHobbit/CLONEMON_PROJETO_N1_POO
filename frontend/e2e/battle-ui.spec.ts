import { type Page, expect, test } from '@playwright/test';
import type Phaser from 'phaser';
import type { Battle, Combatant, Move, TurnResponse } from '../src/api/types';

declare global {
  interface Window {
    __clonemon?: { game: Phaser.Game };
  }
}

function move(name: string, partial: Partial<Move> = {}): Move {
  return {
    name, element: 'FOGO', power: 40, accuracy: 100, maxPp: 25, ppLeft: 25, learnLevel: 1,
    effect: 'NONE', effectChance: 0, effectStat: null, effectStages: 0, ...partial,
  };
}

function combatant(partial: Partial<Combatant>): Combatant {
  return {
    monsterId: null, speciesId: 3, name: 'Lucifer', element: 'FOGO', level: 12, currentHp: 30, maxHp: 35,
    fainted: false, status: 'NONE', moves: null, ...partial,
  };
}

/** Lucifer no nivel 12 (4 golpes, paralisado) contra um Coiso: a batalha ja tinha comecado. */
const battle: Battle = {
  id: 4242,
  status: 'AWAITING_ACTION',
  playerActive: 0,
  playerTeam: [
    combatant({
      monsterId: 1,
      status: 'PARALYSIS',
      moves: [
        move('Molotov'),
        move('Fogo na Babilonia', { power: 90, accuracy: 85, maxPp: 10, ppLeft: 10 }),
        move('Churrasco grego', { power: 60, maxPp: 15, ppLeft: 15, learnLevel: 7, effect: 'BURN', effectChance: 30 }),
        move('Sangue nos olhos', {
          power: 0, maxPp: 15, ppLeft: 0, learnLevel: 12, effect: 'RAISE', effectChance: 100, effectStat: 'ATK', effectStages: 2,
        }),
      ],
    }),
  ],
  enemy: combatant({ speciesId: 2, name: 'Coiso', element: 'ROCHA', level: 11, currentHp: 33, maxHp: 33 }),
  log: ['Um COISO selvagem apareceu!'],
};

function afterTurn(): TurnResponse {
  const state = { playerActive: 0, playerHp: 30, playerStatus: 'PARALYSIS' as const };
  return {
    events: [
      { ...state, text: 'Lucifer usou Churrasco grego!', effect: 'ENEMY_HIT', enemyHp: 25, enemyStatus: 'NONE' },
      { ...state, text: 'Coiso pegou fogo!', effect: 'ENEMY_STATUS', enemyHp: 25, enemyStatus: 'BURN' },
      { ...state, text: 'Coiso sofreu com a queimadura!', effect: 'ENEMY_STATUS_DAMAGE', enemyHp: 23, enemyStatus: 'BURN' },
      { ...state, text: 'Voce fugiu!', effect: 'FLED', enemyHp: 23, enemyStatus: 'BURN' },
    ],
    battle: {
      ...battle,
      status: 'FLED',
      playerTeam: [{ ...battle.playerTeam[0], status: 'NONE' }],
      enemy: { ...battle.enemy, currentHp: 23 },
    },
  };
}

/** Textos visiveis da cena de batalha (o canvas nao tem DOM). */
function battleTexts(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const scene = window.__clonemon!.game.scene.getScene('Battle');
    return scene.children.list
      .filter((o): o is Phaser.GameObjects.Text => o.type === 'Text' && (o as Phaser.GameObjects.Text).visible)
      .map((t) => t.text);
  });
}

async function press(page: Page, key: string, times = 1): Promise<void> {
  for (let i = 0; i < times; i++) {
    await page.keyboard.press(key);
    await page.waitForTimeout(150);
  }
}

test('battle menu fits 4 moves and info boxes show status badges', async ({ page }) => {
  let turnBody: unknown = null;
  await page.route(`**/api/battles/${battle.id}/turns`, async (route) => {
    turnBody = route.request().postDataJSON();
    await route.fulfill({ json: afterTurn() });
  });

  await page.goto('/');
  await page.waitForFunction(() => window.__clonemon?.game.scene.isActive('Title'), null, { timeout: 20_000 });
  await page.evaluate((b) => {
    const game = window.__clonemon!.game;
    game.scene.stop('Title');
    game.scene.start('Battle', { battle: b });
  }, battle);
  await page.waitForFunction(() => window.__clonemon?.game.scene.isActive('Battle'));
  await page.waitForTimeout(600);

  // Selo do jogador paralisado; o oponente nao tem status.
  expect(await battleTexts(page)).toContain('PAR');
  expect(await battleTexts(page)).not.toContain('QUE');

  // "A batalha continua!" ate aparecer o menu de acoes; depois LUTAR.
  for (let i = 0; i < 5 && !(await battleTexts(page)).includes('LUTAR'); i++) await press(page, 'Enter');
  await press(page, 'Enter');
  const menu = await battleTexts(page);
  expect(menu).toEqual(expect.arrayContaining([
    `MOLOTOV${' '.repeat(13)}25/25`,
    `FOGO NA BABILONIA   10/10`,
    `CHURRASCO GREGO     15/15`,
    `SANGUE NOS OLHOS     0/15`,
    'POD 40 PRE 100',
  ]));
  await page.screenshot({ path: 'test-results/screens/battle-4-moves.png' });

  await press(page, 'ArrowDown', 3);
  expect(await battleTexts(page)).toContain('POD -- PRE 100 ATK+2');
  await press(page, 'Enter'); // sem PP: nada acontece
  await press(page, 'ArrowUp');
  expect(await battleTexts(page)).toContain('POD 60 PRE 100 QUE 30%');
  await press(page, 'Enter');

  await expect.poll(() => turnBody).toEqual({ action: 'MOVE', moveIndex: 2 });
  // Avanca as mensagens ate o selo de queimadura aparecer no oponente.
  for (let i = 0; i < 10 && !(await battleTexts(page)).includes('QUE'); i++) await press(page, 'Enter');
  expect(await battleTexts(page)).toContain('QUE');
  await page.screenshot({ path: 'test-results/screens/battle-status-badges.png' });
});
