import { describe, expect, it, vi } from 'vitest';
import type { WorldPosition } from '../api/types';
import { ENCOUNTER_RATE, rollEncounter } from './encounter';
import { PositionSaver } from './saver';

describe('rollEncounter', () => {
  it('triggers in tall grass when the roll is under 12%', () => {
    expect(ENCOUNTER_RATE).toBe(0.12);
    expect(rollEncounter('tallGrass', () => 0.119)).toBe(true);
    expect(rollEncounter('tallGrass', () => 0.12)).toBe(false);
  });

  it('never triggers outside tall grass and does not even roll', () => {
    const rng = vi.fn(() => 0);
    for (const t of ['grass', 'path', 'flowers', 'bridge', null] as const) expect(rollEncounter(t, rng)).toBe(false);
    expect(rng).not.toHaveBeenCalled();
  });

  it('happens about 12% of the steps', () => {
    let seed = 42;
    const lcg = () => ((seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
    const hits = Array.from({ length: 10_000 }, () => rollEncounter('tallGrass', lcg)).filter(Boolean).length;
    expect(hits / 10_000).toBeGreaterThan(0.1);
    expect(hits / 10_000).toBeLessThan(0.14);
  });
});

describe('PositionSaver', () => {
  const at = (x: number, y: number, facing: WorldPosition['facing'] = 'UP'): WorldPosition => ({ x, y, facing });

  function setup(result: () => Promise<void> = async () => {}) {
    const save = vi.fn((_p: WorldPosition) => result());
    return { save, saver: new PositionSaver(save, 10) };
  }

  it('saves once every 10 steps', async () => {
    const { save, saver } = setup();
    for (let i = 1; i <= 25; i++) await saver.step(at(i, 0));
    expect(save.mock.calls.map(([p]) => p.x)).toEqual([10, 20]);
  });

  it('flush saves right away and restarts the count', async () => {
    const { save, saver } = setup();
    for (let i = 1; i <= 5; i++) await saver.step(at(i, 0));
    await saver.flush(at(5, 0));
    for (let i = 6; i <= 14; i++) await saver.step(at(i, 0));
    expect(save.mock.calls.map(([p]) => p.x)).toEqual([5]);
  });

  it('does not save the same position twice in a row', async () => {
    const { save, saver } = setup();
    await saver.flush(at(3, 4, 'LEFT'));
    await saver.flush(at(3, 4, 'LEFT'));
    await saver.flush(at(3, 4, 'DOWN'));
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('swallows failures and retries the same position later', async () => {
    let fail = true;
    const { save, saver } = setup(async () => {
      if (fail) throw new Error('offline');
    });
    await expect(saver.flush(at(1, 1))).resolves.toBeUndefined();
    fail = false;
    await saver.flush(at(1, 1));
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('sends a copy of the position', async () => {
    const { save, saver } = setup();
    const p = at(7, 7);
    await saver.flush(p);
    p.x = 99;
    expect(save.mock.calls[0][0]).toEqual(at(7, 7));
  });
});
