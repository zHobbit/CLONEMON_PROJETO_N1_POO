// Phaser so como tipo: este modulo continua importavel em testes (node) sem carregar o motor.
import type Phaser from 'phaser';
import { sheet } from './raster';
import {
  CHARACTER_IDS, CHAR_H, CHAR_W, type CharacterId, DIRECTIONS, type Direction, characterSheet,
} from './worldCharacters';
import { TILE_SIZE, Tile, drawAllTiles, drawCenter, drawExclaim, drawHouse } from './world';

export { TILE_SIZE, Tile };
export type { CharacterId, Direction };

export const WORLD_TEXTURES = {
  tiles: 'world-tiles',
  center: 'world-center',
  house: 'world-house',
  exclaim: 'world-exclaim',
} as const;

const WALK_FPS = 8;
/** Quadros de uma passada: passo A, parado, passo B, parado. */
const WALK_CYCLE = [1, 0, 2, 0] as const;

/** Folha `char-${id}`: quadros 16x24; quadro = linha * 3 + coluna; linhas: baixo, esquerda, direita, cima. */
export function characterKey(id: CharacterId): string {
  return `char-${id}`;
}

/** Animacao `char-${id}-walk-${dir}`: passo A, parado, passo B, parado, a 8 quadros por segundo, em laco. */
export function walkAnimKey(id: CharacterId, dir: Direction): string {
  return `char-${id}-walk-${dir}`;
}

interface FrameRect {
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

function addTexture(
  scene: Phaser.Scene,
  key: string,
  art: { width: number; height: number; rgba: Uint8ClampedArray },
  frames: readonly FrameRect[] = [],
): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, art.width, art.height);
  if (!tex) return;
  tex.getContext().putImageData(new ImageData(art.rgba as Uint8ClampedArray<ArrayBuffer>, art.width, art.height), 0, 0);
  for (const f of frames) tex.add(f.name, 0, f.x, f.y, f.w, f.h);
  tex.refresh();
}

/** Desenha toda a arte do mapa uma vez e registra texturas e animacoes de caminhada (idempotente). */
export function registerWorldArt(scene: Phaser.Scene): void {
  const tiles = drawAllTiles();
  addTexture(
    scene,
    WORLD_TEXTURES.tiles,
    sheet(tiles),
    tiles.map((_, i) => ({ name: String(i), x: i * TILE_SIZE, y: 0, w: TILE_SIZE, h: TILE_SIZE })),
  );
  const single = (c: ReturnType<typeof drawCenter>) => ({ width: c.width, height: c.height, rgba: c.rgba() });
  addTexture(scene, WORLD_TEXTURES.center, single(drawCenter()));
  addTexture(scene, WORLD_TEXTURES.house, single(drawHouse()));
  addTexture(scene, WORLD_TEXTURES.exclaim, single(drawExclaim()));

  for (const id of CHARACTER_IDS) {
    const key = characterKey(id);
    const frames: FrameRect[] = [];
    for (let i = 0; i < 12; i++) {
      frames.push({ name: String(i), x: (i % 3) * CHAR_W, y: Math.floor(i / 3) * CHAR_H, w: CHAR_W, h: CHAR_H });
    }
    addTexture(scene, key, characterSheet(id), frames);
    DIRECTIONS.forEach((dir, row) => {
      const anim = walkAnimKey(id, dir);
      if (scene.anims.exists(anim)) return;
      scene.anims.create({
        key: anim,
        frames: WALK_CYCLE.map((col) => ({ key, frame: String(row * 3 + col) })),
        frameRate: WALK_FPS,
        repeat: -1,
      });
    });
  }
}
