import type Phaser from 'phaser';

/**
 * PROVISORIO: ladrilhos de cor chapada e personagens de retangulos, so para o motor do mapa funcionar.
 * A arte de verdade (mesmas exportacoes) substitui este arquivo.
 */

export const TILE_SIZE = 16;

export const WORLD_TEXTURES = { tiles: 'world-tiles', center: 'world-center', house: 'world-house', exclaim: 'world-exclaim' } as const;

export enum Tile {
  GRASS = 0,
  TALL_GRASS = 1,
  PATH = 2,
  WATER = 3,
  TREE = 4,
  FLOWERS = 5,
  FENCE = 6,
  SIGN = 7,
  ROCK = 8,
  SAND = 9,
  BRIDGE = 10,
  TALL_GRASS_FRONT = 11,
}

export type CharacterId = 'player' | 'caio' | 'bia' | 'zeca';
export type Direction = 'down' | 'left' | 'right' | 'up';

const DIRECTIONS: readonly Direction[] = ['down', 'left', 'right', 'up'];
const CHARACTERS: readonly CharacterId[] = ['player', 'caio', 'bia', 'zeca'];
const CHAR_W = 16;
const CHAR_H = 24;

/** Folha 48x96: quadro = linha*3+coluna; linhas baixo/esquerda/direita/cima, colunas parado/passoA/passoB. */
export function characterKey(id: CharacterId): string {
  return `char-${id}`;
}

export function walkAnimKey(id: CharacterId, dir: Direction): string {
  return `char-${id}-walk-${dir}`;
}

type Draw = (g: CanvasRenderingContext2D) => void;

/** Cor base e detalhe de cada ladrilho, na ordem do enum. */
const TILE_DRAW: Record<Tile, Draw> = {
  [Tile.GRASS]: (g) => fill(g, '#63c74d'),
  [Tile.TALL_GRASS]: (g) => {
    fill(g, '#3e8948');
    stripes(g, '#265c42', 0);
  },
  [Tile.PATH]: (g) => fill(g, '#e4a672'),
  [Tile.WATER]: (g) => {
    fill(g, '#0099db');
    g.fillStyle = '#2ce8f5';
    g.fillRect(3, 5, 5, 1);
    g.fillRect(9, 11, 5, 1);
  },
  [Tile.TREE]: (g) => {
    fill(g, '#63c74d');
    g.fillStyle = '#265c42';
    g.fillRect(1, 1, 14, 11);
    g.fillStyle = '#733e39';
    g.fillRect(6, 12, 4, 4);
  },
  [Tile.FLOWERS]: (g) => {
    fill(g, '#63c74d');
    g.fillStyle = '#e43b44';
    g.fillRect(3, 3, 3, 3);
    g.fillRect(10, 9, 3, 3);
    g.fillStyle = '#fee761';
    g.fillRect(10, 2, 3, 3);
    g.fillRect(3, 10, 3, 3);
  },
  [Tile.FENCE]: (g) => {
    fill(g, '#63c74d');
    g.fillStyle = '#b86f50';
    g.fillRect(0, 5, 16, 3);
    g.fillRect(0, 10, 16, 3);
    g.fillRect(2, 3, 3, 12);
    g.fillRect(11, 3, 3, 12);
  },
  [Tile.SIGN]: (g) => {
    fill(g, '#63c74d');
    g.fillStyle = '#733e39';
    g.fillRect(7, 9, 2, 6);
    g.fillStyle = '#b86f50';
    g.fillRect(2, 2, 12, 8);
  },
  [Tile.ROCK]: (g) => {
    fill(g, '#63c74d');
    g.fillStyle = '#8b9bb4';
    g.fillRect(2, 4, 12, 10);
    g.fillStyle = '#5a6988';
    g.fillRect(2, 11, 12, 3);
  },
  [Tile.SAND]: (g) => fill(g, '#ead4aa'),
  [Tile.BRIDGE]: (g) => {
    fill(g, '#b86f50');
    g.fillStyle = '#733e39';
    for (let y = 3; y < 16; y += 4) g.fillRect(0, y, 16, 1);
  },
  [Tile.TALL_GRASS_FRONT]: (g) => stripes(g, '#265c42', 8),
};

function fill(g: CanvasRenderingContext2D, color: string): void {
  g.fillStyle = color;
  g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
}

/** Folhas de capim (a partir de `top`): o mesmo desenho serve de frente para cobrir as pernas. */
function stripes(g: CanvasRenderingContext2D, color: string, top: number): void {
  g.fillStyle = color;
  for (let x = 1; x < 16; x += 4) g.fillRect(x, Math.max(top, 6), 2, 16 - Math.max(top, 6));
  g.fillStyle = '#3e8948';
  if (top > 0) g.fillRect(0, 13, 16, 3);
}

const BODY: Record<CharacterId, string> = { player: '#e43b44', caio: '#124e89', bia: '#b55088', zeca: '#feae34' };

/** Personagem de retangulos: corpo colorido, cabeca e uma marca escura do lado para onde olha. */
function drawCharacter(g: CanvasRenderingContext2D, id: CharacterId, dir: Direction, step: number): void {
  const bob = step === 0 ? 0 : 1;
  g.fillStyle = '#181425';
  g.fillRect(3, 6 + bob, 10, 18 - bob);
  g.fillStyle = BODY[id];
  g.fillRect(4, 13 + bob, 8, 8);
  g.fillStyle = '#e8b796';
  g.fillRect(4, 7 + bob, 8, 6);
  const leg = step === 1 ? 4 : step === 2 ? 9 : -1;
  g.fillStyle = '#3a4466';
  if (leg < 0) {
    g.fillRect(4, 21, 3, 3);
    g.fillRect(9, 21, 3, 3);
  } else g.fillRect(leg, 21, 3, 3);
  g.fillStyle = '#181425';
  if (dir === 'down') g.fillRect(5, 9 + bob, 6, 2);
  else if (dir === 'left') g.fillRect(4, 9 + bob, 3, 2);
  else if (dir === 'right') g.fillRect(9, 9 + bob, 3, 2);
  else {
    g.fillStyle = BODY[id];
    g.fillRect(4, 7 + bob, 8, 4);
  }
}

function canvasTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: Draw): Phaser.Textures.CanvasTexture | null {
  if (scene.textures.exists(key)) return null;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return null;
  draw(tex.getContext());
  return tex;
}

/** Casa ou centro: paredes, telhado e porta na posicao combinada (centro (2,3), casa (1,2)). */
function building(roof: string, wall: string, doorX: number, doorY: number): Draw {
  return (g) => {
    const w = g.canvas.width;
    const h = g.canvas.height;
    g.fillStyle = wall;
    g.fillRect(0, 16, w, h - 16);
    g.fillStyle = roof;
    g.fillRect(0, 0, w, 20);
    g.fillStyle = '#3e2731';
    g.fillRect(doorX * TILE_SIZE + 3, doorY * TILE_SIZE, 10, 16);
  };
}

/** Gera todas as texturas e animacoes do mapa (pode ser chamada de novo sem efeito). */
export function registerWorldArt(scene: Phaser.Scene): void {
  const tiles = canvasTexture(scene, WORLD_TEXTURES.tiles, TILE_SIZE * 12, TILE_SIZE, (g) => {
    for (let t = 0; t < 12; t++) {
      g.save();
      g.translate(t * TILE_SIZE, 0);
      TILE_DRAW[t as Tile](g);
      g.restore();
    }
  });
  if (tiles) {
    for (let t = 0; t < 12; t++) tiles.add(String(t), 0, t * TILE_SIZE, 0, TILE_SIZE, TILE_SIZE);
    tiles.refresh();
  }

  canvasTexture(scene, WORLD_TEXTURES.center, 80, 64, building('#e43b44', '#ead4aa', 2, 3))?.refresh();
  canvasTexture(scene, WORLD_TEXTURES.house, 64, 48, building('#124e89', '#c0cbdc', 1, 2))?.refresh();
  canvasTexture(scene, WORLD_TEXTURES.exclaim, 16, 16, (g) => {
    g.fillStyle = '#181425';
    g.fillRect(2, 0, 12, 14);
    g.fillStyle = '#ffffff';
    g.fillRect(3, 1, 10, 12);
    g.fillStyle = '#e43b44';
    g.fillRect(7, 3, 2, 6);
    g.fillRect(7, 10, 2, 2);
  })?.refresh();

  for (const id of CHARACTERS) {
    const key = characterKey(id);
    const sheet = canvasTexture(scene, key, CHAR_W * 3, CHAR_H * 4, (g) => {
      DIRECTIONS.forEach((dir, row) => {
        for (let col = 0; col < 3; col++) {
          g.save();
          g.translate(col * CHAR_W, row * CHAR_H);
          drawCharacter(g, id, dir, col);
          g.restore();
        }
      });
    });
    if (sheet) {
      for (let i = 0; i < 12; i++) sheet.add(String(i), 0, (i % 3) * CHAR_W, Math.floor(i / 3) * CHAR_H, CHAR_W, CHAR_H);
      sheet.refresh();
    }
    DIRECTIONS.forEach((dir, row) => {
      const anim = walkAnimKey(id, dir);
      if (scene.anims.exists(anim)) return;
      const frames = [1, 0, 2, 0].map((col) => ({ key, frame: String(row * 3 + col) }));
      scene.anims.create({ key: anim, frames, frameRate: 8, repeat: -1 });
    });
  }
}
