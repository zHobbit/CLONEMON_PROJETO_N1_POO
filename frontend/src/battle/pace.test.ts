import { describe, expect, it } from 'vitest';
import type { Effect, TurnEvent } from '../api/types';
import { Pace } from './pace';

function turn(...effects: Effect[]): TurnEvent[] {
  return effects.map((effect) => ({
    text: '', effect, playerActive: 0, playerHp: 10, enemyHp: 10, playerStatus: 'NONE', enemyStatus: 'NONE',
  }));
}

describe('Pace', () => {
  it('speeds up after 3 and 6 calm turns', () => {
    const pace = new Pace();
    expect(pace.factor).toBe(1);
    for (let i = 0; i < 3; i++) pace.afterTurn(turn('ENEMY_HIT', 'PLAYER_HIT'));
    expect(pace.factor).toBe(1.5);
    for (let i = 0; i < 3; i++) pace.afterTurn(turn('ENEMY_HIT'));
    expect(pace.factor).toBe(2);
  });

  it('goes back to normal speed after a switch or a faint', () => {
    for (const effect of ['PLAYER_SWITCH', 'ENEMY_SWITCH', 'PLAYER_FAINT', 'ENEMY_FAINT'] as const) {
      const pace = new Pace();
      for (let i = 0; i < 6; i++) pace.afterTurn(turn('ENEMY_HIT'));
      pace.afterTurn(turn('ENEMY_HIT', effect));
      expect(pace.factor, effect).toBe(1);
    }
  });
});
