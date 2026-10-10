import { describe, expect, it } from 'vitest';
import { ahead, canEnter, facingToward, reachable, sightDistance, step } from './grid';
import { type WorldMap, parseRows } from './maps';

/** Mapa pequeno: arvores na borda, agua, pedra, cerca, placa e uma casa. */
const map: WorldMap = {
  terrain: parseRows([
    'TTTTTTT',
    'T.."".T',
    'T.~R+.T',
    'T..S#.T',
    'T=_..*T',
    'TTTTTTT',
  ]),
  width: 7,
  height: 6,
  spawn: { x: 1, y: 1, facing: 'DOWN' },
  npcs: [],
  buildings: [],
  signs: [],
};

describe('canEnter', () => {
  it('allows grass, tall grass, path, bridge and flowers', () => {
    for (const p of [{ x: 1, y: 1 }, { x: 3, y: 1 }, { x: 2, y: 4 }, { x: 1, y: 4 }, { x: 5, y: 4 }]) expect(canEnter(map, p)).toBe(true);
  });

  it('blocks water, rocks, fences, signs, buildings, trees and the outside', () => {
    for (const p of [
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 0, y: 0 },
      { x: -1, y: 2 },
      { x: 3, y: 9 },
    ])
      expect(canEnter(map, p), `(${p.x},${p.y})`).toBe(false);
  });

  it('blocks tiles where someone is standing', () => {
    expect(canEnter(map, { x: 1, y: 2 }, new Set(['1,2']))).toBe(false);
  });
});

describe('step', () => {
  it('moves one tile and faces the direction', () => {
    expect(step(map, { x: 1, y: 1, facing: 'DOWN' }, 'RIGHT')).toEqual({ position: { x: 2, y: 1, facing: 'RIGHT' }, moved: true });
  });

  it('only turns when bumping into something', () => {
    expect(step(map, { x: 1, y: 1, facing: 'DOWN' }, 'UP')).toEqual({ position: { x: 1, y: 1, facing: 'UP' }, moved: false });
    expect(step(map, { x: 1, y: 3, facing: 'UP' }, 'RIGHT', new Set()).moved).toBe(true);
    expect(step(map, { x: 1, y: 3, facing: 'UP' }, 'DOWN', new Set(['1,4'])).moved).toBe(false);
  });
});

describe('sightDistance', () => {
  const watcher = { x: 1, y: 1, facing: 'RIGHT' as const, sight: 3 };

  it('sees a target straight ahead within range', () => {
    expect(sightDistance(map, watcher, { x: 2, y: 1 })).toBe(1);
    expect(sightDistance(map, watcher, { x: 4, y: 1 })).toBe(3);
  });

  it('does not see beyond range, behind or to the side', () => {
    expect(sightDistance(map, watcher, { x: 5, y: 1 })).toBeNull();
    expect(sightDistance(map, { ...watcher, x: 5, facing: 'LEFT' }, { x: 5, y: 2 })).toBeNull();
    expect(sightDistance(map, watcher, { x: 1, y: 2 })).toBeNull();
  });

  it('is blocked by obstacles and other characters', () => {
    expect(sightDistance(map, { x: 1, y: 2, facing: 'RIGHT', sight: 4 }, { x: 5, y: 2 })).toBeNull();
    expect(sightDistance(map, watcher, { x: 4, y: 1 }, new Set(['3,1']))).toBeNull();
  });
});

describe('helpers', () => {
  it('ahead walks in the facing direction', () => {
    expect(ahead({ x: 3, y: 3 }, 'UP', 2)).toEqual({ x: 3, y: 1 });
  });

  it('facingToward points at the other tile', () => {
    expect(facingToward({ x: 2, y: 2 }, { x: 2, y: 5 })).toBe('DOWN');
    expect(facingToward({ x: 2, y: 2 }, { x: 0, y: 2 })).toBe('LEFT');
    expect(facingToward({ x: 2, y: 2 }, { x: 2, y: 1 })).toBe('UP');
    expect(facingToward({ x: 2, y: 2 }, { x: 3, y: 2 })).toBe('RIGHT');
  });

  it('reachable floods only free tiles', () => {
    const area = reachable(map, { x: 1, y: 1 });
    expect(area.has('5,4')).toBe(true);
    expect(area.has('2,2')).toBe(false);
    expect(reachable(map, { x: 1, y: 1 }, new Set(['2,1', '1,2'])).size).toBe(1);
  });
});
