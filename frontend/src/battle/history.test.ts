import { describe, expect, it } from 'vitest';
import { historyLines, scrollOffset } from './history';

describe('historyLines', () => {
  it('groups the texts under a header per turn, older lines under ANTES', () => {
    const lines = historyLines(
      [
        { turn: 0, text: 'Um COISO selvagem apareceu!' },
        { turn: 1, text: 'Lindoya usou Cuspe!' },
        { turn: 1, text: 'E super efetivo!' },
        { turn: 2, text: 'Coiso desmaiou!' },
      ],
      28,
    );
    expect(lines).toEqual([
      'ANTES',
      ' Um COISO selvagem apareceu!',
      'TURNO 1',
      ' Lindoya usou Cuspe!',
      ' E super efetivo!',
      'TURNO 2',
      ' Coiso desmaiou!',
    ]);
  });

  it('wraps long texts by word, keeping the indent', () => {
    const lines = historyLines([{ turn: 1, text: 'Lindoya esta paralisada! Nao conseguiu se mover!' }], 20);
    expect(lines).toEqual(['TURNO 1', ' Lindoya esta', ' paralisada! Nao', ' conseguiu se mover!']);
    for (const l of lines) expect(l.length).toBeLessThanOrEqual(20);
  });
});

describe('scrollOffset', () => {
  it('starts at the end, so the latest turn is visible', () => {
    expect(scrollOffset(30, 10)).toBe(20);
    expect(scrollOffset(5, 10)).toBe(0);
  });

  it('moves by a step and stays within the list', () => {
    expect(scrollOffset(30, 10, 20, -3)).toBe(17);
    expect(scrollOffset(30, 10, 1, -3)).toBe(0);
    expect(scrollOffset(30, 10, 19, +3)).toBe(20);
  });
});
