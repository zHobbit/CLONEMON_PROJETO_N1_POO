import { describe, expect, it } from 'vitest';
import type { ReplaySummary } from '../api/types';
import { SPEEDS, footerLabel, listLabel, listStart, nextSpeed } from './controls';

describe('nextSpeed', () => {
  it('moves through 1x, 2x and 4x without wrapping', () => {
    expect(SPEEDS).toEqual([1, 2, 4]);
    expect(nextSpeed(0, 1)).toBe(1);
    expect(nextSpeed(2, 1)).toBe(2);
    expect(nextSpeed(0, -1)).toBe(0);
  });
});

describe('footerLabel', () => {
  it('shows turn, speed and play state', () => {
    expect(footerLabel(3, 12, 1, true)).toBe('TURNO 3/12 2x >');
    expect(footerLabel(12, 12, 0, false)).toBe('TURNO 12/12 1x ||');
  });
});

describe('listLabel', () => {
  const base: ReplaySummary = { id: 1, finishedAt: '2026-10-24T12:00:00Z', opponent: 'CAIO', lead: 'Lindoya', result: 'PLAYER_WON', turnCount: 7 };

  it('fits opponent, result, turns and date in 28 columns', () => {
    expect(listLabel(base)).toBe('CAIO        VENCEU  7T 24/10');
    expect(listLabel({ ...base, opponent: 'PaoDeAcucar selvagem', result: 'PLAYER_LOST', turnCount: 12 }))
      .toBe('PAODEACUCAR PERDEU 12T 24/10');
    expect(listLabel({ ...base, result: 'FLED' })).toContain(' FUGIU ');
    expect(listLabel(base)).toHaveLength(28);
  });
});

describe('listStart', () => {
  it('keeps the cursor inside the visible window', () => {
    expect(listStart(0, 20, 12, 0)).toBe(0);
    expect(listStart(12, 20, 12, 0)).toBe(1);
    expect(listStart(19, 20, 12, 1)).toBe(8);
    expect(listStart(3, 20, 12, 8)).toBe(3);
  });
});
