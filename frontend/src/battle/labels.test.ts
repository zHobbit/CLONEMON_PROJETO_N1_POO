import { describe, expect, it } from 'vitest';
import type { Move } from '../api/types';
import { STATUS_BADGE, effectLabel, moveInfo, moveRow } from './labels';

function move(partial: Partial<Move> = {}): Move {
  return {
    name: 'Cuspe', element: 'AGUA', power: 40, accuracy: 100, maxPp: 25, ppLeft: 25, learnLevel: 1,
    effect: 'NONE', effectChance: 0, effectStat: null, effectStages: 0, ...partial,
  };
}

describe('STATUS_BADGE', () => {
  it('has a 3-letter badge per status and none without status', () => {
    expect(STATUS_BADGE).toEqual({ NONE: '', BURN: 'QUE', FREEZE: 'CON', PARALYSIS: 'PAR', SLEEP: 'DOR' });
  });
});

describe('effectLabel', () => {
  it('is empty without effect', () => {
    expect(effectLabel(move())).toBe('');
  });

  it('shows the status badge and the chance when it is not certain', () => {
    expect(effectLabel(move({ effect: 'BURN', effectChance: 30 }))).toBe('QUE 30%');
    expect(effectLabel(move({ effect: 'SLEEP', effectChance: 100 }))).toBe('DOR');
  });

  it('raises are positive (own stat) and lowers negative (target stat)', () => {
    expect(effectLabel(move({ effect: 'RAISE', effectChance: 100, effectStat: 'ATK', effectStages: 2 }))).toBe('ATK+2');
    expect(effectLabel(move({ effect: 'LOWER', effectChance: 30, effectStat: 'SPD', effectStages: 1 }))).toBe('VEL-1 30%');
  });
});

describe('moveRow', () => {
  it('pads the name to 19 columns so the pp lines up', () => {
    expect(moveRow(move())).toBe(`CUSPE${' '.repeat(15)}25/25`);
    expect(moveRow(move({ name: 'Vap de alta pressao', ppLeft: 3, maxPp: 10 }))).toBe('VAP DE ALTA PRESSAO  3/10');
    expect(moveRow(move({ ppLeft: null }))).toHaveLength(25);
  });
});

describe('moveInfo', () => {
  it('lists power, accuracy and effect', () => {
    expect(moveInfo(move())).toBe('POD 40 PRE 100');
    expect(moveInfo(move({ power: 0, accuracy: 75, effect: 'SLEEP', effectChance: 100 }))).toBe('POD -- PRE 75 DOR');
  });

  it('fits the line next to the type icon', () => {
    const longest = move({ power: 80, accuracy: 100, effect: 'LOWER', effectChance: 30, effectStat: 'SPD', effectStages: 1 });
    expect(moveInfo(longest).length).toBeLessThanOrEqual(26);
  });
});
