import { describe, expect, it } from 'vitest';
import { pickBackdrop } from './backdrop';

describe('pickBackdrop', () => {
  it('uses the town for trainer battles at any hour', () => {
    for (const hour of [0, 9, 18, 23]) expect(pickBackdrop('caio', hour), `hour ${hour}`).toBe('town');
  });

  it('follows the clock in wild battles', () => {
    expect(pickBackdrop(null, 6)).toBe('field');
    expect(pickBackdrop(null, 16)).toBe('field');
    expect(pickBackdrop(null, 17)).toBe('dusk');
    expect(pickBackdrop(null, 18)).toBe('dusk');
    expect(pickBackdrop(null, 19)).toBe('night');
    expect(pickBackdrop(null, 0)).toBe('night');
    expect(pickBackdrop(null, 5)).toBe('night');
  });
});
