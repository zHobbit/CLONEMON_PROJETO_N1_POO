import type { Element } from '../api/types';
import { C, RAMPS, type Ramp } from './palette';
import { type Mask, PixelCanvas, ellipse, line, minus, poly, union } from './raster';

/** Efeitos de golpe: 32x32, poucos quadros, desenhados sobre quem foi atingido. */
export const HIT_FX_SIZE = 32;
export const HIT_FX_FRAMES = 5;

type Point = [number, number];

const MID = HIT_FX_SIZE / 2;
const TAU = Math.PI * 2;

const ICE: Ramp = { tones: [C.white, C.cyan, C.blue], outline: C.navy };
const SPARK: Ramp = { tones: [C.yellow], outline: C.orange };
const FLASH: Ramp = { tones: [C.white, C.yellow], outline: C.amber };

/** Ponto a uma distancia e angulo de (x, y). */
const polar = (x: number, y: number, r: number, angle: number): Point => [x + r * Math.cos(angle), y + r * Math.sin(angle)];

/** Losango ao longo de `angle`: ponta em `tip`, largura `w` a 35% do comprimento. */
function spike(from: Point, angle: number, length: number, w: number): Mask {
  const [x, y] = from;
  const [mx, my] = polar(x, y, length * 0.35, angle);
  return poly([
    polar(x, y, 1.5, angle + Math.PI),
    polar(mx, my, w, angle + Math.PI / 2),
    polar(x, y, length, angle),
    polar(mx, my, w, angle - Math.PI / 2),
  ]);
}

/** Folha pontuda nas duas pontas, girada em `angle`. */
function leaf(center: Point, angle: number, length: number, w: number): Mask {
  const [x, y] = center;
  const along = (d: number, side: number): Point => {
    const [px, py] = polar(x, y, d, angle);
    return polar(px, py, side, angle + Math.PI / 2);
  };
  return poly([
    along(length, 0),
    along(length * 0.2, w),
    along(-length * 0.6, w * 0.6),
    along(-length, 0),
    along(-length * 0.6, -w * 0.6),
    along(length * 0.2, -w),
  ]);
}

function zigzag(points: readonly Point[], r: number): Mask {
  const parts: Mask[] = [];
  for (let i = 0; i + 1 < points.length; i++) parts.push(line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], r));
  return union(...parts);
}

/** AGUA: gotas espirrando em roda e um anel de espuma. */
function splash(c: PixelCanvas, f: number): void {
  if (f <= 2) {
    const ring = [4, 6.5, 9][f];
    c.fill(minus(ellipse(MID, MID, ring, ring * 0.8), ellipse(MID, MID, ring - 1.5, ring * 0.8 - 1.5)), f === 0 ? C.white : C.cyan);
  }
  if (f === 0) c.paint(ellipse(MID, MID, 3, 2.5), RAMPS.water);
  const r = [4, 7, 10, 12, 13][f];
  const s = [2.4, 2.4, 2.1, 1.7, 1.3][f];
  for (let i = 0; i < 8; i++) {
    const [x, y0] = polar(MID, MID, r, (i / 8) * TAU + Math.PI / 8);
    const y = y0 + f * f * 0.2; // as gotas caem
    c.paint(ellipse(x, y, s, s * 1.25), RAMPS.water);
    if (s >= 2) c.set(Math.round(x - 1), Math.round(y - 1.5), C.white);
  }
}

/** ROCHA: lascas angulosas voando para fora, com poeira no comeco. */
function shards(c: PixelCanvas, f: number): void {
  const d = [3, 7, 10, 12, 13][f];
  const size = [4, 4, 3.6, 3, 2.4][f];
  if (f <= 2) {
    for (let i = 0; i < 10; i++) {
      const [x, y] = polar(MID, MID, d * 0.6 + (i % 3), (i / 10) * TAU);
      c.set(Math.round(x), Math.round(y), i % 2 === 0 ? C.tan : C.khaki);
    }
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.3;
    const [x, y0] = polar(MID, MID, d, a);
    const y = y0 + f * f * 0.25;
    const corners = [0.2, 1.9, 3.3, 4.7].map((k, j) => polar(x, y, size * [1, 0.65, 0.9, 0.6][j], a + k));
    c.paint(poly(corners), RAMPS.stone);
  }
}

/** FOGO: tres linguas de fogo que sobem, crescem e soltam brasas. */
function flames(c: PixelCanvas, f: number): void {
  const h = [8, 15, 19, 15, 9][f];
  const base = 27;
  const tongues: [number, number, number][] = [[-8, 0.65, 6], [0, 1, 8], [8, 0.75, 6]];
  tongues.forEach(([dx, scale, w], i) => {
    const x = MID + dx;
    const hh = h * scale;
    const wob = ((f + i) % 2 === 0 ? 1 : -1) * 1.2;
    c.paint(poly([
      [x - w / 2, base],
      [x - w / 2 - 0.5, base - hh * 0.45],
      [x - w / 4 + wob, base - hh * 0.75],
      [x + wob, base - hh],
      [x + w / 4, base - hh * 0.6],
      [x + w / 2 + 0.5, base - hh * 0.35],
      [x + w / 2, base],
    ]), RAMPS.flame);
    c.fill(poly([[x - w / 4, base - 1], [x + wob / 2, base - hh * 0.5], [x + w / 4, base - 1]]), C.yellow);
  });
  if (f >= 2) {
    for (let i = 0; i < 4; i++) {
      const x = 9 + i * 5 + (i % 2) * 2;
      const y = base - h - 2 - (f - 2) * 3 - (i % 2) * 2;
      c.set(x, Math.max(0, y), i % 2 === 0 ? C.yellow : C.amber);
    }
  }
}

/** GELO: cristais que crescem do centro e depois se partem em cacos brilhantes. */
function ice(c: PixelCanvas, f: number): void {
  if (f <= 2) {
    const len = [6, 11, 13][f];
    for (let i = 0; i < 6; i++) c.paint(spike([MID, MID], (i / 6) * TAU - Math.PI / 2, len, 2.2), ICE);
    c.stamp(['.6.', '6Q6', '.6.'], MID - 1, MID - 1);
    return;
  }
  const r = f === 3 ? 12 : 14;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + Math.PI / 8;
    c.paint(spike(polar(MID, MID, r - 2, a), a, f === 3 ? 4 : 3, f === 3 ? 1.6 : 1.2), ICE);
  }
  for (let i = 0; i < 4; i++) {
    const [x, y] = polar(MID, MID, r - 6, (i / 4) * TAU + f);
    c.stamp(['.6.', '6Q6', '.6.'], Math.round(x) - 1, Math.round(y) - 1);
  }
}

/** GRAMA: folhas girando em espiral para fora. */
function leaves(c: PixelCanvas, f: number): void {
  const r = [3, 7, 10, 12, 14][f];
  const length = f === 4 ? 3 : 4;
  const w = f === 4 ? 1.6 : 2.2;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + f * 0.6;
    c.paint(leaf(polar(MID, MID, r, a), a + f * 0.9 + i, length, w), RAMPS.leaf);
  }
}

/** RAIO: clarao no centro e faiscas em zigue-zague. */
function sparks(c: PixelCanvas, f: number): void {
  if (f <= 1) c.paint(ellipse(MID, MID, f === 0 ? 3.5 : 5, f === 0 ? 3.5 : 5), FLASH);
  const len = [8, 12, 14, 14, 13][f];
  const inner = f >= 3 ? len * 0.5 : 3;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + f * 0.35 - Math.PI / 2;
    if (f <= 3) {
      const points = [0, 1, 2, 3].map((k) => {
        const [x, y] = polar(MID, MID, inner + ((len - inner) * k) / 3, a);
        return polar(x, y, k % 2 === 0 ? -1.5 : 1.5, a + Math.PI / 2);
      });
      c.paint(zigzag(points, 0.9), SPARK, { flat: 0 });
    }
    if (f >= 2) {
      const [x, y] = polar(MID, MID, len + 1, a + 0.6);
      c.stamp(['.y.', 'y6y', '.y.'], Math.round(x) - 1, Math.round(y) - 1);
    }
  }
}

const DRAW: Record<Element, (c: PixelCanvas, frame: number) => void> = {
  AGUA: splash, ROCHA: shards, FOGO: flames, GELO: ice, GRAMA: leaves, RAIO: sparks,
};

export function drawHitEffect(element: Element, frame: number): PixelCanvas {
  const c = new PixelCanvas(HIT_FX_SIZE, HIT_FX_SIZE);
  DRAW[element](c, frame);
  return c;
}

/** Alto-falante cortado: aparece no canto da tela quando o som esta desligado. */
export const MUTE_ICON = [
  '.....0.....',
  '....00.....',
  '...060.....',
  '000660.r..r',
  '066660..rr.',
  '066660..rr.',
  '000660.r..r',
  '...060.....',
  '....00.....',
  '.....0.....',
];

export function drawMuteIcon(): PixelCanvas {
  return new PixelCanvas(MUTE_ICON[0].length, MUTE_ICON.length).stamp(MUTE_ICON, 0, 0);
}
