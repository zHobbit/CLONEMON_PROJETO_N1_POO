import { describe, expect, it } from 'vitest';
import type { Battle, TurnEvent } from '../api/types';
import { planTurn, viewOf } from './playback';

const start = { playerActive: 0, playerHp: 20, enemyHp: 18 };

function ev(text: string, partial: Partial<TurnEvent> = {}): TurnEvent {
  return { text, effect: 'NONE', playerActive: 0, playerHp: 20, enemyHp: 18, ...partial };
}

describe('planTurn', () => {
  it('animates a hit: text, flash, hp drop, then waits', () => {
    const steps = planTurn(start, [ev('Lucifer usou Molotov!', { effect: 'ENEMY_HIT', enemyHp: 9 })]);
    expect(steps).toEqual([
      { kind: 'text', text: 'Lucifer usou Molotov!' },
      { kind: 'flash', side: 'enemy' },
      { kind: 'hp', side: 'enemy', to: 9 },
      { kind: 'wait' },
    ]);
  });

  it('a miss only shows text', () => {
    const steps = planTurn(start, [ev('Coiso usou Meteoro!'), ev('Errou!')]);
    expect(steps.map((s) => s.kind)).toEqual(['text', 'wait', 'text', 'wait']);
  });

  it('tracks hp across events so each change animates once', () => {
    const steps = planTurn(start, [
      ev('Lucifer usou Molotov!', { effect: 'ENEMY_HIT', enemyHp: 9 }),
      ev('E super efetivo!', { enemyHp: 9 }),
      ev('Olaf usou Cubo de gelo!', { effect: 'PLAYER_HIT', enemyHp: 9, playerHp: 14 }),
    ]);
    expect(steps.filter((s) => s.kind === 'hp')).toEqual([
      { kind: 'hp', side: 'enemy', to: 9 },
      { kind: 'hp', side: 'player', to: 14 },
    ]);
    expect(steps.filter((s) => s.kind === 'flash')).toEqual([
      { kind: 'flash', side: 'enemy' },
      { kind: 'flash', side: 'player' },
    ]);
  });

  it('faints after the message', () => {
    const steps = planTurn(start, [ev('Olaf desmaiou!', { effect: 'ENEMY_FAINT', enemyHp: 0 })]);
    expect(steps.map((s) => s.kind)).toEqual(['text', 'hp', 'faint', 'wait']);
    expect(steps[2]).toEqual({ kind: 'faint', side: 'enemy' });
  });

  it('switches before announcing the new monster, without animating its hp', () => {
    const steps = planTurn(start, [ev('Vai, Groot!', { effect: 'PLAYER_SWITCH', playerActive: 1, playerHp: 30 })]);
    expect(steps).toEqual([
      { kind: 'switch', teamIndex: 1, hp: 30 },
      { kind: 'text', text: 'Vai, Groot!' },
      { kind: 'wait' },
    ]);
  });

  it('animates hp changes that have no effect, like a level up', () => {
    const steps = planTurn(start, [ev('Lucifer subiu para o nivel 6!', { playerHp: 22 })]);
    expect(steps).toContainEqual({ kind: 'hp', side: 'player', to: 22 });
  });

  it('returns nothing for no events', () => {
    expect(planTurn(start, [])).toEqual([]);
  });
});

describe('viewOf', () => {
  it('reads the active monster and enemy hp', () => {
    const combatant = (hp: number) => ({
      monsterId: 1, speciesId: 1, name: 'x', element: 'AGUA' as const, level: 5, currentHp: hp, maxHp: 30, fainted: false, moves: null,
    });
    const battle: Battle = {
      id: 1, status: 'AWAITING_ACTION', playerActive: 1, playerTeam: [combatant(5), combatant(25)], enemy: combatant(12), log: [],
    };
    expect(viewOf(battle)).toEqual({ playerActive: 1, playerHp: 25, enemyHp: 12 });
  });
});
