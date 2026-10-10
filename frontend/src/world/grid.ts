import type { Facing, WorldPosition } from '../api/types';
import type { Point, Terrain, WorldMap } from './maps';

export const DELTA: Readonly<Record<Facing, Point>> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

export const OPPOSITE: Readonly<Record<Facing, Facing>> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };

/** Chao onde se pode pisar; agua, arvores, pedras, cercas, placas e construcoes bloqueiam. */
const WALKABLE: ReadonlySet<Terrain> = new Set<Terrain>(['grass', 'tallGrass', 'path', 'flowers', 'sand', 'bridge']);

/** Chaves "x,y" das posicoes ocupadas por personagens. */
export type Occupied = ReadonlySet<string>;

export function cellKey(p: Point): string {
  return `${p.x},${p.y}`;
}

export function ahead(p: Point, facing: Facing, distance = 1): Point {
  const d = DELTA[facing];
  return { x: p.x + d.x * distance, y: p.y + d.y * distance };
}

export function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

/** Terreno do ladrilho, ou null fora do mapa. */
export function terrainAt(map: WorldMap, p: Point): Terrain | null {
  return map.terrain[p.y]?.[p.x] ?? null;
}

export function isWalkableTerrain(t: Terrain | null): boolean {
  return t !== null && WALKABLE.has(t);
}

/** Da para entrar no ladrilho: dentro do mapa, chao livre e ninguem parado nele. */
export function canEnter(map: WorldMap, p: Point, occupied: Occupied = new Set()): boolean {
  return isWalkableTerrain(terrainAt(map, p)) && !occupied.has(cellKey(p));
}

/** Um passo: sempre vira para a direcao; anda se o ladrilho a frente estiver livre. */
export function step(map: WorldMap, from: WorldPosition, dir: Facing, occupied: Occupied = new Set()): { position: WorldPosition; moved: boolean } {
  const target = ahead(from, dir);
  if (!canEnter(map, target, occupied)) return { position: { ...from, facing: dir }, moved: false };
  return { position: { ...target, facing: dir }, moved: true };
}

export interface Watcher extends Point {
  facing: Facing;
  sight: number;
}

/**
 * Distancia (1..sight) em que o observador ve o alvo em linha reta a frente, ou null.
 * Terreno bloqueado ou outro personagem no meio do caminho tapam a visao.
 */
export function sightDistance(map: WorldMap, watcher: Watcher, target: Point, occupied: Occupied = new Set()): number | null {
  for (let d = 1; d <= watcher.sight; d++) {
    const p = ahead(watcher, watcher.facing, d);
    if (samePoint(p, target)) return d;
    if (!canEnter(map, p, occupied)) return null;
  }
  return null;
}

/** Direcao para olhar de `from` para um vizinho `to` (ou para a linha/coluna dele). */
export function facingToward(from: Point, to: Point): Facing {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? 'LEFT' : 'RIGHT';
  return dy < 0 ? 'UP' : 'DOWN';
}

/** Ladrilhos alcancaveis a partir de `start`, andando so por chao livre. */
export function reachable(map: WorldMap, start: Point, occupied: Occupied = new Set()): Set<string> {
  const seen = new Set<string>([cellKey(start)]);
  const queue: Point[] = [start];
  while (queue.length > 0) {
    const p = queue.shift()!;
    for (const dir of Object.keys(DELTA) as Facing[]) {
      const n = ahead(p, dir);
      const k = cellKey(n);
      if (!seen.has(k) && canEnter(map, n, occupied)) {
        seen.add(k);
        queue.push(n);
      }
    }
  }
  return seen;
}
