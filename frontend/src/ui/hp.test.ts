import { describe, expect, it } from 'vitest';
import { HP_GREEN, HP_RED, HP_YELLOW, formatHp, hpColor, hpFillWidth } from './hp';

describe('hpColor', () => {
  it('is green above half, yellow above a fifth, red below', () => {
    expect(hpColor(51, 100)).toBe(HP_GREEN);
    expect(hpColor(50, 100)).toBe(HP_YELLOW);
    expect(hpColor(21, 100)).toBe(HP_YELLOW);
    expect(hpColor(20, 100)).toBe(HP_RED);
    expect(hpColor(0, 100)).toBe(HP_RED);
  });

  it('handles a zero max without dividing by zero', () => {
    expect(hpColor(0, 0)).toBe(HP_RED);
  });
});

describe('hpFillWidth', () => {
  it('is proportional to hp', () => {
    expect(hpFillWidth(50, 100, 48)).toBe(24);
    expect(hpFillWidth(100, 100, 48)).toBe(48);
  });

  it('keeps at least one pixel while alive and none when fainted', () => {
    expect(hpFillWidth(1, 999, 48)).toBe(1);
    expect(hpFillWidth(0, 100, 48)).toBe(0);
  });

  it('never overflows the bar', () => {
    expect(hpFillWidth(150, 100, 48)).toBe(48);
  });
});

describe('formatHp', () => {
  it('pads to a fixed width for the monospace font', () => {
    expect(formatHp(7, 23)).toBe('  7/ 23');
    expect(formatHp(123, 145)).toBe('123/145');
  });

  it('rounds tween values and clamps negatives', () => {
    expect(formatHp(6.6, 23)).toBe('  7/ 23');
    expect(formatHp(-1, 23)).toBe('  0/ 23');
  });
});
