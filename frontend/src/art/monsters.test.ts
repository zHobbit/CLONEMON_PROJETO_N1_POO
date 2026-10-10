import { describe, expect, it } from 'vitest';
import type { Element } from '../api/types';
import { ELEMENT_ICON_SIZE, ICON_GRIDS, drawElementIcon } from './icons';
import { ICON_SIZE, SPRITE_SIZE, drawIcon, drawMonster, hasCustomArt } from './monsters';
import { C, CHARS, PALETTE } from './palette';
import type { PixelCanvas } from './raster';
import { BATTLE_BG, drawBattleBackground, drawTitleBackground } from './scenery';

const SPECIES: [string, Element][] = [
  ['Lindoya', 'AGUA'], ['Coiso', 'ROCHA'], ['Lucifer', 'FOGO'], ['Olaf', 'GELO'], ['Groot', 'GRAMA'], ['EletroPaulo', 'RAIO'],
  ['Boto', 'AGUA'], ['PaoDeAcucar', 'ROCHA'], ['Pimentinha', 'FOGO'], ['Pinguim', 'GELO'], ['Abacaxi', 'GRAMA'], ['Gatonet', 'RAIO'],
];
const ELEMENTS: Element[] = ['AGUA', 'ROCHA', 'FOGO', 'GELO', 'GRAMA', 'RAIO'];

const samePixels = (a: PixelCanvas, b: PixelCanvas) => a.px.every((v, i) => v === b.px[i]);
const onlyPalette = (c: PixelCanvas) => c.px.every((v) => v >= -1 && v < PALETTE.length);

describe.each(SPECIES)('%s', (name, element) => {
  it('has custom art', () => {
    expect(hasCustomArt(name)).toBe(true);
  });

  it.each(['front', 'back'] as const)('%s view stands on the ground and fits the 48px box', (view) => {
    const c = drawMonster(name, element, view, 0);
    const b = c.bounds()!;
    expect(c.width).toBe(SPRITE_SIZE);
    expect(b.y1).toBeGreaterThanOrEqual(42); // pes perto do chao
    expect(b.x1 - b.x0).toBeGreaterThanOrEqual(24);
    expect(b.y1 - b.y0).toBeGreaterThanOrEqual(30);
    expect(onlyPalette(c)).toBe(true);
  });

  it('idle animation frames differ and front differs from back', () => {
    const front0 = drawMonster(name, element, 'front', 0);
    expect(samePixels(front0, drawMonster(name, element, 'front', 1))).toBe(false);
    expect(samePixels(drawMonster(name, element, 'back', 0), drawMonster(name, element, 'back', 1))).toBe(false);
    expect(samePixels(front0, drawMonster(name, element, 'back', 0))).toBe(false);
  });

  it('draws a 16px icon with eyes', () => {
    const icon = drawIcon(name, element);
    expect(icon.width).toBe(ICON_SIZE);
    expect([...icon.px].filter((v) => v === C.black).length).toBeGreaterThanOrEqual(2);
    expect(icon.bounds()).not.toBeNull();
  });
});

it('unknown species get a generic blob in their element color', () => {
  expect(hasCustomArt('Missingno')).toBe(false);
  expect(drawMonster('Missingno', 'FOGO', 'front', 0).bounds()).not.toBeNull();
});

describe('element icons', () => {
  it.each(ELEMENTS)('%s icon is drawn inside 11x11', (element) => {
    const icon = drawElementIcon(element);
    expect(icon.width).toBe(ELEMENT_ICON_SIZE);
    expect(icon.bounds()).not.toBeNull();
  });

  it('hand-drawn grids are 11x11 and only use palette characters', () => {
    for (const grid of Object.values(ICON_GRIDS)) {
      expect(grid).toHaveLength(ELEMENT_ICON_SIZE);
      for (const row of grid) {
        expect(row).toHaveLength(ELEMENT_ICON_SIZE);
        for (const ch of row) expect(ch === '.' || ch in CHARS).toBe(true);
      }
    }
  });
});

describe('scenery', () => {
  it('backgrounds are fully opaque', () => {
    const battle = drawBattleBackground();
    expect(battle.width).toBe(BATTLE_BG.width);
    expect(battle.px.every((v) => v >= 0)).toBe(true);
    expect(drawTitleBackground().px.every((v) => v >= 0)).toBe(true);
  });
});
