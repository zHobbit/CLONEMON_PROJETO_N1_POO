import { describe, expect, it } from 'vitest';
import type { Element } from '../api/types';
import { HIT_FX_FRAMES, HIT_FX_SIZE, MUTE_ICON, drawHitEffect, drawMuteIcon } from './effects';
import { C, PALETTE } from './palette';
import type { PixelCanvas } from './raster';

const ELEMENTS: Element[] = ['AGUA', 'ROCHA', 'FOGO', 'GELO', 'GRAMA', 'RAIO'];
const frames = (e: Element) => Array.from({ length: HIT_FX_FRAMES }, (_, f) => drawHitEffect(e, f));
const samePixels = (a: PixelCanvas, b: PixelCanvas) => a.px.every((v, i) => v === b.px[i]);
const count = (c: PixelCanvas, color: number) => [...c.px].filter((v) => v === color).length;

describe.each(ELEMENTS)('%s hit effect', (element) => {
  it('every frame is drawn inside the 32px box with palette colors only', () => {
    for (const frame of frames(element)) {
      expect(frame.width).toBe(HIT_FX_SIZE);
      expect(frame.bounds()).not.toBeNull();
      expect(frame.px.every((v) => v >= -1 && v < PALETTE.length)).toBe(true);
    }
  });

  it('animates: consecutive frames differ', () => {
    const all = frames(element);
    for (let i = 1; i < all.length; i++) expect(samePixels(all[i - 1], all[i])).toBe(false);
  });

  it('keeps a transparent margin so it reads as a sprite, not a box', () => {
    const b = frames(element)[0].bounds()!;
    expect(b.x0).toBeGreaterThan(0);
    expect(b.x1).toBeLessThan(HIT_FX_SIZE - 1);
  });
});

describe('hit effects per element', () => {
  it('each element has its own look', () => {
    const peak = ELEMENTS.map((e) => drawHitEffect(e, 2));
    for (let i = 0; i < peak.length; i++)
      for (let j = i + 1; j < peak.length; j++) expect(samePixels(peak[i], peak[j])).toBe(false);
  });

  it('uses the element colors', () => {
    expect(count(drawHitEffect('AGUA', 1), C.blue)).toBeGreaterThan(0);
    expect(count(drawHitEffect('FOGO', 2), C.yellow)).toBeGreaterThan(0);
    expect(count(drawHitEffect('GRAMA', 2), C.green) + count(drawHitEffect('GRAMA', 2), C.forest)).toBeGreaterThan(0);
    expect(count(drawHitEffect('ROCHA', 1), C.steel) + count(drawHitEffect('ROCHA', 1), C.silver)).toBeGreaterThan(0);
    expect(count(drawHitEffect('GELO', 1), C.cyan)).toBeGreaterThan(0);
    expect(count(drawHitEffect('RAIO', 1), C.yellow)).toBeGreaterThan(0);
  });
});

describe('mute icon', () => {
  it('is a small speaker with a red cross', () => {
    const icon = drawMuteIcon();
    expect(icon.width).toBe(MUTE_ICON[0].length);
    expect(MUTE_ICON.every((row) => row.length === icon.width)).toBe(true);
    expect(count(icon, C.red)).toBeGreaterThanOrEqual(8);
    expect(count(icon, C.white)).toBeGreaterThan(0);
  });
});
