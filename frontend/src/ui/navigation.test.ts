import { describe, expect, it } from 'vitest';
import { mapKey, moveCursor } from './navigation';

describe('mapKey', () => {
  it('maps confirm, cancel and arrows', () => {
    expect(mapKey('Enter')).toBe('confirm');
    expect(mapKey(' ')).toBe('confirm');
    expect(mapKey('z')).toBe('confirm');
    expect(mapKey('Escape')).toBe('cancel');
    expect(mapKey('X')).toBe('cancel');
    expect(mapKey('ArrowLeft')).toBe('left');
  });

  it('ignores other keys', () => {
    expect(mapKey('a')).toBeUndefined();
    expect(mapKey('Tab')).toBeUndefined();
  });
});

describe('moveCursor', () => {
  it('moves through a vertical list and stops at the ends', () => {
    expect(moveCursor(0, 'down', 3)).toBe(1);
    expect(moveCursor(2, 'down', 3)).toBe(2);
    expect(moveCursor(0, 'up', 3)).toBe(0);
    expect(moveCursor(1, 'left', 3)).toBe(1);
  });

  it('moves through a grid by rows and columns', () => {
    // 0 1 2
    // 3 4 5
    expect(moveCursor(0, 'right', 6, 3)).toBe(1);
    expect(moveCursor(2, 'right', 6, 3)).toBe(2);
    expect(moveCursor(3, 'left', 6, 3)).toBe(3);
    expect(moveCursor(1, 'down', 6, 3)).toBe(4);
    expect(moveCursor(4, 'up', 6, 3)).toBe(1);
  });

  it('does not land on empty cells of an incomplete last row', () => {
    // 0 1
    // 2
    expect(moveCursor(1, 'down', 3, 2)).toBe(1);
    expect(moveCursor(0, 'down', 3, 2)).toBe(2);
  });
});
