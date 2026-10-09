import { describe, expect, it } from 'vitest';
import { C, type Ramp } from './palette';
import { PixelCanvas, ellipse, line, mirror, poly, rect, sheet, toneFor } from './raster';

const ramp: Ramp = { tones: [C.white, C.silver, C.steel], outline: C.black };

describe('masks', () => {
  it('ellipse centered on the canvas is horizontally symmetric', () => {
    const m = ellipse(24, 24, 10, 6);
    for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) expect(m(x, y)).toBe(m(47 - x, y));
  });

  it('mirror unions a shape with its reflection', () => {
    const m = mirror(rect(2, 0, 2, 1), 10);
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((x) => m(x, 0))).toEqual([2, 3, 6, 7]);
  });

  it('poly and line hit the expected pixels', () => {
    const triangle = poly([[0, 0], [10, 0], [0, 10]]);
    expect(triangle(1, 1)).toBe(true);
    expect(triangle(8, 8)).toBe(false);
    const segment = line(0, 5, 10, 5, 1);
    expect(segment(5, 4)).toBe(true);
    expect(segment(5, 8)).toBe(false);
  });
});

describe('PixelCanvas.paint', () => {
  it('outlines the shadow side and uses the darkest tone on the lit side', () => {
    const c = new PixelCanvas(8, 8).paint(rect(2, 2, 4, 4), ramp);
    expect(c.get(5, 4)).toBe(C.black); // borda direita
    expect(c.get(3, 5)).toBe(C.black); // borda de baixo
    expect(c.get(2, 3)).toBe(C.steel); // borda esquerda (lado da luz)
    expect(c.get(3, 2)).toBe(C.steel); // borda de cima
    expect(c.get(1, 1)).toBe(-1);
  });

  it('can skip the outline and paint a flat tone', () => {
    const c = new PixelCanvas(4, 4).paint(rect(0, 0, 4, 4), ramp, { outline: false, flat: 1 });
    expect([...c.px]).toEqual(new Array(16).fill(C.silver));
  });

  it('lights the top-left of a sphere more than the bottom-right', () => {
    expect(toneFor(-0.5, -0.5, 4, 1, 0, false)).toBeLessThan(toneFor(0.5, 0.5, 4, 1, 0, false));
  });

  it('samples the drawing space when scaled down for icons', () => {
    const icon = new PixelCanvas(16, 16, 3).paint(ellipse(24, 24, 18, 18), ramp);
    const b = icon.bounds()!;
    expect(b.x1 - b.x0).toBeGreaterThanOrEqual(10);
    expect(b.x1 - b.x0).toBeLessThanOrEqual(13);
  });
});

describe('PixelCanvas.stamp', () => {
  it('places hand-drawn pixels and their mirror image', () => {
    const c = new PixelCanvas(10, 2).stamp(['06', '.r'], 1, 0, { mirror: true });
    expect(c.get(1, 0)).toBe(C.black);
    expect(c.get(2, 0)).toBe(C.white);
    expect(c.get(8, 0)).toBe(C.black);
    expect(c.get(7, 0)).toBe(C.white);
    expect(c.get(7, 1)).toBe(C.red);
    expect(c.get(1, 1)).toBe(-1);
  });

  it('rejects characters outside the palette', () => {
    expect(() => new PixelCanvas(2, 2).stamp(['?'], 0, 0)).toThrow(/Unknown pixel char/);
  });
});

describe('sheet', () => {
  it('lays frames side by side', () => {
    const a = new PixelCanvas(2, 1).stamp(['0.'], 0, 0);
    const b = new PixelCanvas(2, 1).stamp(['.6'], 0, 0);
    const s = sheet([a, b]);
    expect(s.width).toBe(4);
    const alpha = [0, 1, 2, 3].map((i) => s.rgba[i * 4 + 3]);
    expect(alpha).toEqual([255, 0, 0, 255]);
  });
});
