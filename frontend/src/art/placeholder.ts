import Phaser from 'phaser';
import type { Element, Species } from '../api/types';
import { ELEMENT_COLORS } from '../config';

export type View = 'front' | 'back';
const SIZE = 48;

export function monsterTexture(speciesId: number, view: View): string {
  return `mon-${view}-${speciesId}`;
}

/**
 * Sprites provisorios gerados por codigo: um corpo na cor do elemento com uma "crista"
 * diferente para cada tipo. Serao substituidos pela pixel art na fase 5.
 */
export function createPlaceholderMonsters(scene: Phaser.Scene, species: Species[]): void {
  for (const s of species) {
    for (const view of ['front', 'back'] as const) {
      const key = monsterTexture(s.id, view);
      if (scene.textures.exists(key)) continue;
      const tex = scene.textures.createCanvas(key, SIZE, SIZE);
      if (!tex) continue;
      paint(tex.getContext(), s.element, view);
      tex.refresh();
    }
  }
}

type Shape = (x: number, y: number) => boolean;

const CX = 24;
const CY = 31;

const body: Shape = (x, y) => ((x + 0.5 - CX) / 17) ** 2 + ((y + 0.5 - CY) / 14) ** 2 <= 1;

const spike = (tipX: number, tipY: number, baseY: number, halfBase: number): Shape => (x, y) => {
  if (y < tipY || y > baseY) return false;
  const half = ((y - tipY) / (baseY - tipY)) * halfBase;
  return Math.abs(x + 0.5 - tipX) <= half;
};

const CRESTS: Record<Element, Shape> = {
  AGUA: spike(CX, 9, 20, 6),
  ROCHA: (x, y) => y >= 13 && y <= 19 && x >= CX - 10 && x < CX + 10 && (x + y) % 7 !== 0,
  FOGO: (x, y) => spike(CX - 8, 10, 20, 4)(x, y) || spike(CX, 6, 20, 5)(x, y) || spike(CX + 8, 10, 20, 4)(x, y),
  GELO: (x, y) => spike(CX - 6, 8, 20, 3)(x, y) || spike(CX + 6, 8, 20, 3)(x, y),
  GRAMA: (x, y) => ((x + 0.5 - (CX + 4)) / 8) ** 2 + ((y + 0.5 - 13) / 4) ** 2 <= 1,
  RAIO: (x, y) => spike(CX - 11, 6, 21, 3)(x, y) || spike(CX + 11, 6, 21, 3)(x, y),
};

function hex(color: number, factor = 1): string {
  const ch = (shift: number) => Math.min(255, Math.round(((color >> shift) & 0xff) * factor));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

function paint(ctx: CanvasRenderingContext2D, element: Element, view: View): void {
  const crest = CRESTS[element];
  const inShape: Shape = (x, y) => x >= 0 && y >= 0 && x < SIZE && y < SIZE && (body(x, y) || crest(x, y));
  const base = ELEMENT_COLORS[element];

  ctx.clearRect(0, 0, SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (!inShape(x, y)) continue;
      const edge = !inShape(x - 1, y) || !inShape(x + 1, y) || !inShape(x, y - 1) || !inShape(x, y + 1);
      if (edge) ctx.fillStyle = '#1b1b2f';
      else if (y > CY + 6) ctx.fillStyle = hex(base, 0.7);
      else if (y < CY - 4 && x < CX - 2) ctx.fillStyle = hex(base, 1.25);
      else ctx.fillStyle = hex(base);
      ctx.fillRect(x, y, 1, 1);
    }
  }

  if (view === 'front') {
    for (const ex of [CX - 7, CX + 4]) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex, CY - 5, 3, 4);
      ctx.fillStyle = '#1b1b2f';
      ctx.fillRect(ex + 1, CY - 4, 2, 3);
    }
    ctx.fillRect(CX - 2, CY + 2, 4, 1);
  } else {
    // De costas: so um brilho nas "costas".
    ctx.fillStyle = hex(base, 1.35);
    ctx.fillRect(CX - 8, CY - 8, 6, 2);
  }
}
