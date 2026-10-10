import { describe, expect, it } from 'vitest';
import type { Battle, BattleStatus, Combatant, Element, TurnEvent } from '../api/types';
import { HEAVY_HIT, beats, turnCues } from './cues';

function mon(element: Element, hp: number, maxHp = 40, level = 5): Combatant {
  return { monsterId: 1, speciesId: 1, name: element, element, level, currentHp: hp, maxHp, fainted: hp === 0, moves: null, status: 'NONE' };
}

function battle(team: Combatant[], enemy: Combatant, status: BattleStatus = 'AWAITING_ACTION', playerActive = 0): Battle {
  return { id: 1, status, playerActive, playerTeam: team, enemy, log: [], npcId: null, npcName: null, enemyTeamSize: 1, enemyActive: 0 };
}

function ev(effect: TurnEvent['effect'], playerHp: number, enemyHp: number, playerActive = 0): TurnEvent {
  return { text: '', effect, playerActive, playerHp, enemyHp, playerStatus: 'NONE', enemyStatus: 'NONE' };
}

describe('beats', () => {
  it('follows the element cycle', () => {
    expect(beats('AGUA', 'ROCHA')).toBe(true);
    expect(beats('RAIO', 'AGUA')).toBe(true);
    expect(beats('ROCHA', 'AGUA')).toBe(false);
    expect(beats('FOGO', 'FOGO')).toBe(false);
  });
});

describe('turnCues', () => {
  const before = battle([mon('FOGO', 40)], mon('GRAMA', 40));

  it('uses the attacker element from the battle state for each hit', () => {
    const cues = turnCues(before, before, [ev('ENEMY_HIT', 40, 35), ev('NONE', 40, 35), ev('PLAYER_HIT', 36, 35)]);
    expect(cues.hits.map((h) => [h.target, h.element])).toEqual([
      ['enemy', 'FOGO'],
      ['player', 'GRAMA'],
    ]);
  });

  it('a hit of 30% or more of max hp is heavy', () => {
    const heavy = Math.ceil(40 * HEAVY_HIT);
    const cues = turnCues(before, before, [ev('PLAYER_HIT', 40 - heavy, 40), ev('PLAYER_HIT', 40 - heavy - (heavy - 1), 40)]);
    expect(cues.hits.map((h) => h.heavy)).toEqual([true, false]);
  });

  it('type advantage makes the hit sound strong even when it is light', () => {
    const cues = turnCues(before, before, [ev('ENEMY_HIT', 40, 39), ev('PLAYER_HIT', 39, 39)]);
    expect(cues.hits[0]).toMatchObject({ heavy: false, strong: false }); // FOGO nao vence GRAMA
    expect(cues.hits[1]).toMatchObject({ heavy: false, strong: false });
    const watery = battle([mon('AGUA', 40)], mon('ROCHA', 40));
    expect(turnCues(watery, watery, [ev('ENEMY_HIT', 40, 39)]).hits[0]).toMatchObject({ heavy: false, strong: true });
  });

  it('measures damage against the monster that switched in', () => {
    const team = [mon('FOGO', 40), mon('AGUA', 20, 20)];
    const start = battle(team, mon('RAIO', 40));
    const cues = turnCues(start, start, [ev('PLAYER_SWITCH', 20, 40, 1), ev('PLAYER_HIT', 14, 40, 1)]);
    expect(cues.hits).toEqual([{ target: 'player', element: 'RAIO', heavy: true, strong: true }]);
  });

  it('reports victory, defeat and level ups from the final state', () => {
    const won = battle([mon('FOGO', 42, 42, 6)], mon('GRAMA', 0), 'PLAYER_WON');
    expect(turnCues(before, won, [])).toMatchObject({ outcome: 'victory', levelUp: true });
    const lost = battle([mon('FOGO', 0)], mon('GRAMA', 40), 'PLAYER_LOST');
    expect(turnCues(before, lost, [])).toMatchObject({ outcome: 'defeat', levelUp: false });
    expect(turnCues(before, before, []).outcome).toBeNull();
  });

  it('a miss produces no hit', () => {
    expect(turnCues(before, before, [ev('NONE', 40, 40), ev('NONE', 40, 40)]).hits).toEqual([]);
  });
});
