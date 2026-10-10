import { describe, expect, it } from 'vitest';
import { cellKey, canEnter, isWalkableTerrain, reachable, terrainAt } from './grid';
import { BUILDING_SHAPE, ROUTE_1, doorOf, parseRows } from './maps';

const map = ROUTE_1;
const npcCells = new Set(map.npcs.map(cellKey));
/** Tudo o que o jogador alcanca a partir do ponto de partida (NPCs parados bloqueiam). */
const fromSpawn = reachable(map, map.spawn, npcCells);

describe('ROUTE_1', () => {
  it('is a rectangular grid of about 40x30 tiles', () => {
    expect(map.width).toBe(40);
    expect(map.height).toBe(30);
    for (const row of map.terrain) expect(row).toHaveLength(map.width);
  });

  it('is closed by blocking tiles on every border', () => {
    for (let x = 0; x < map.width; x++) {
      expect(isWalkableTerrain(terrainAt(map, { x, y: 0 })), `(${x},0)`).toBe(false);
      expect(isWalkableTerrain(terrainAt(map, { x, y: map.height - 1 })), `(${x},bottom)`).toBe(false);
    }
    for (let y = 0; y < map.height; y++) {
      expect(isWalkableTerrain(terrainAt(map, { x: 0, y })), `(0,${y})`).toBe(false);
      expect(isWalkableTerrain(terrainAt(map, { x: map.width - 1, y })), `(right,${y})`).toBe(false);
    }
  });

  it('spawns the player on a free tile', () => {
    expect(canEnter(map, map.spawn, npcCells)).toBe(true);
  });

  it('places every building exactly over its footprint', () => {
    const footprint = new Set<string>();
    for (const b of map.buildings) {
      const { w, h } = BUILDING_SHAPE[b.kind];
      for (let y = b.y; y < b.y + h; y++) for (let x = b.x; x < b.x + w; x++) footprint.add(cellKey({ x, y }));
    }
    const marked = new Set<string>();
    map.terrain.forEach((row, y) => row.forEach((t, x) => t === 'building' && marked.add(cellKey({ x, y }))));
    expect([...marked].sort()).toEqual([...footprint].sort());
  });

  it('has a Centro and every door can be reached from below', () => {
    expect(map.buildings.filter((b) => b.kind === 'center')).toHaveLength(1);
    for (const b of map.buildings) {
      const door = doorOf(b);
      expect(terrainAt(map, door)).toBe('building');
      expect(fromSpawn.has(cellKey({ x: door.x, y: door.y + 1 })), `${b.kind} at (${b.x},${b.y})`).toBe(true);
    }
  });

  it('puts every sign on a sign tile that can be read from a free neighbour', () => {
    for (const s of map.signs) {
      expect(terrainAt(map, s)).toBe('sign');
      const neighbours = [
        { x: s.x, y: s.y + 1 },
        { x: s.x, y: s.y - 1 },
        { x: s.x - 1, y: s.y },
        { x: s.x + 1, y: s.y },
      ];
      expect(neighbours.some((n) => fromSpawn.has(cellKey(n))), `sign at (${s.x},${s.y})`).toBe(true);
      expect(s.text.length).toBeGreaterThan(0);
    }
    const signTiles = map.terrain.flat().filter((t) => t === 'sign').length;
    expect(signTiles).toBe(map.signs.length);
  });

  it('places caio, bia and zeca on free route tiles, zeca last near the top', () => {
    expect(map.npcs.map((n) => n.id)).toEqual(['caio', 'bia', 'zeca']);
    for (const n of map.npcs) {
      expect(isWalkableTerrain(terrainAt(map, n)), n.id).toBe(true);
      expect(n.sight).toBeGreaterThan(0);
      expect(n.before.length).toBeGreaterThan(0);
      expect(n.after.length).toBeGreaterThan(0);
      expect(n.y).toBeLessThan(map.spawn.y);
    }
    const zeca = map.npcs.find((n) => n.id === 'zeca')!;
    expect(Math.min(...map.npcs.map((n) => n.y))).toBe(zeca.y);
    expect(zeca.y).toBeLessThan(5);
  });

  it('lets the player reach the tile in front of every trainer', () => {
    for (const n of map.npcs) {
      const dx = n.facing === 'LEFT' ? -1 : n.facing === 'RIGHT' ? 1 : 0;
      const dy = n.facing === 'UP' ? -1 : n.facing === 'DOWN' ? 1 : 0;
      expect(fromSpawn.has(cellKey({ x: n.x + dx, y: n.y + dy })), n.id).toBe(true);
    }
  });

  it('has a town with tall grass, water, a bridge, rocks and flowers', () => {
    const kinds = new Set(map.terrain.flat());
    for (const t of ['tallGrass', 'water', 'bridge', 'rock', 'flowers', 'fence', 'path', 'sand'] as const) expect(kinds).toContain(t);
    // A grama alta da rota e alcancavel.
    expect([...fromSpawn].some((k) => {
      const [x, y] = k.split(',').map(Number);
      return terrainAt(map, { x, y }) === 'tallGrass';
    })).toBe(true);
  });
});

describe('parseRows', () => {
  it('rejects unknown characters', () => {
    expect(() => parseRows(['..?'])).toThrow("'?' em (2,0)");
  });
});
