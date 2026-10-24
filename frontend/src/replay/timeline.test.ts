import { describe, expect, it } from 'vitest';
import type { Effect, Replay, ReplayMonster, TurnEvent } from '../api/types';
import { battleAfter, captionAt, replayHistory } from './timeline';

function mon(name: string, partial: Partial<ReplayMonster> = {}): ReplayMonster {
  return { speciesId: 1, name, element: 'AGUA', level: 5, currentHp: 20, maxHp: 20, status: 'NONE', ...partial };
}

function ev(text: string, effect: Effect, s: Partial<TurnEvent> = {}): TurnEvent {
  return { text, effect, playerActive: 0, playerHp: 20, enemyHp: 20, playerStatus: 'NONE', enemyStatus: 'NONE', enemyActive: 0, ...s };
}

/** Lindoya + Groot contra o CAIO (Boto e Pimentinha). */
const replay: Replay = {
  id: 9, finishedAt: '2026-10-24T12:00:00Z', opponent: 'CAIO', lead: 'Lindoya', result: 'PLAYER_WON', turnCount: 3,
  snapshot: {
    playerTeam: [mon('Lindoya'), mon('Groot', { speciesId: 5, element: 'GRAMA' })],
    enemyTeam: [mon('Boto', { speciesId: 7, maxHp: 12, currentHp: 12 }), mon('Pimentinha', { speciesId: 9, element: 'FOGO', maxHp: 11, currentHp: 11 })],
    playerActive: 0, enemyActive: 0, npcName: 'CAIO',
  },
  turns: [
    { events: [ev('Lindoya usou Cuspe!', 'ENEMY_HIT', { enemyHp: 4 }), ev('Boto queimou!', 'ENEMY_STATUS', { enemyHp: 4, enemyStatus: 'BURN' })],
      playerTeam: [{ level: 5, maxHp: 20 }, { level: 5, maxHp: 20 }] },
    { events: [ev('Vai, Groot!', 'PLAYER_SWITCH', { playerActive: 1, enemyHp: 4, enemyStatus: 'BURN' }),
               ev('Boto desmaiou!', 'ENEMY_FAINT', { playerActive: 1, enemyHp: 0, enemyStatus: 'BURN' }),
               ev('CAIO enviou Pimentinha!', 'ENEMY_SWITCH', { playerActive: 1, enemyHp: 11, enemyActive: 1 })],
      playerTeam: [{ level: 5, maxHp: 20 }, { level: 5, maxHp: 20 }] },
    { events: [ev('Groot usou Folha!', 'ENEMY_HIT', { playerActive: 1, enemyHp: 0, enemyActive: 1 }),
               ev('Groot subiu para o nivel 6!', 'NONE', { playerActive: 1, playerHp: 22, enemyHp: 0, enemyActive: 1 })],
      playerTeam: [{ level: 5, maxHp: 20 }, { level: 6, maxHp: 22 }] },
  ],
};

describe('battleAfter', () => {
  it('starts with the snapshot', () => {
    const b = battleAfter(replay, 0);
    expect(b.status).toBe('AWAITING_ACTION');
    expect(b.playerTeam.map((c) => c.name)).toEqual(['Lindoya', 'Groot']);
    expect(b.enemy.name).toBe('Boto');
    expect(b.npcId).toBe('caio');
    expect(b.npcName).toBe('CAIO');
    expect(b.enemyTeamSize).toBe(2);
  });

  it('applies HP and status changes of each event', () => {
    const b = battleAfter(replay, 1);
    expect(b.enemy.currentHp).toBe(4);
    expect(b.enemy.status).toBe('BURN');
  });

  it('follows player switches, faints and the trainer sending the next monster', () => {
    const b = battleAfter(replay, 2);
    expect(b.playerActive).toBe(1);
    expect(b.enemyActive).toBe(1);
    expect(b.enemy.name).toBe('Pimentinha');
    expect(b.enemy.fainted).toBe(false);
  });

  it('applies the levels after each turn and the final result at the end', () => {
    const b = battleAfter(replay, 3);
    expect(b.playerTeam[1]).toMatchObject({ level: 6, maxHp: 22, currentHp: 22 });
    expect(b.enemy).toMatchObject({ currentHp: 0, fainted: true });
    expect(b.status).toBe('PLAYER_WON');
  });

  it('clamps k to the recorded turns', () => {
    expect(battleAfter(replay, 99).status).toBe('PLAYER_WON');
    expect(battleAfter(replay, -1).enemy.currentHp).toBe(12);
  });
});

describe('replayHistory and captionAt', () => {
  it('lists the texts of the turns already shown', () => {
    expect(replayHistory(replay, 1)).toEqual([
      { turn: 1, text: 'Lindoya usou Cuspe!' },
      { turn: 1, text: 'Boto queimou!' },
    ]);
  });

  it('shows the opponent at the start and the last text of a turn after it', () => {
    expect(captionAt(replay, 0)).toBe('REPLAY: CAIO');
    expect(captionAt(replay, 2)).toBe('CAIO enviou Pimentinha!');
  });
});
