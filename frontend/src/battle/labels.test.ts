import { describe, expect, it } from 'vitest';
import type { Move } from '../api/types';
import { INFO_COLUMNS, STATUS_BADGE, effectLabel, matchup, moveInfo, moveRow } from './labels';

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

describe('matchup', () => {
  it('rates damaging moves against the defender element', () => {
    expect(matchup(move({ element: 'AGUA' }), 'ROCHA')).toBe('super');
    expect(matchup(move({ element: 'AGUA' }), 'RAIO')).toBe('weak');
    expect(matchup(move({ element: 'AGUA' }), 'FOGO')).toBe('neutral');
  });

  it('is neutral for status moves, which deal no damage', () => {
    expect(matchup(move({ element: 'AGUA', power: 0 }), 'ROCHA')).toBe('neutral');
  });
});

describe('moveInfo against a defender', () => {
  it('appends SUPER! or FRACO', () => {
    expect(moveInfo(move({ element: 'AGUA' }), 'ROCHA')).toBe('POD 40 PRE 100 SUPER!');
    expect(moveInfo(move({ element: 'AGUA' }), 'RAIO')).toBe('POD 40 PRE 100 FRACO');
    expect(moveInfo(move({ element: 'AGUA' }), 'FOGO')).toBe('POD 40 PRE 100');
  });

  it('drops the tag when the line would not fit (the row arrow still shows it)', () => {
    const long = move({ power: 80, accuracy: 90, effect: 'LOWER', effectChance: 30, effectStat: 'ATK', effectStages: 1 });
    expect(moveInfo(long, 'RAIO')).toBe('POD 80 PRE 90 ATK-1 30%');
    expect(moveInfo(long, 'RAIO').length).toBeLessThanOrEqual(INFO_COLUMNS);
  });
});
