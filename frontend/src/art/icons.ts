import type { Element } from '../api/types';
import { C, RAMPS } from './palette';
import { PixelCanvas, ellipse, poly, union } from './raster';

/** Icones de tipo 11x11 (impar, para ter um pixel central). */
export const ELEMENT_ICON_SIZE = 11;

const SNOWFLAKE = [
  '.....B.....',
  '.B...B...B.',
  '..B..B..B..',
  '...B.B.B...',
  '....BQB....',
  'BBBBQ6QBBBB',
  '....BQB....',
  '...B.B.B...',
  '..B..B..B..',
  '.B...B...B.',
  '.....B.....',
];

const LEAF = [
  '.......TTT.',
  '.....TTggT.',
  '...TTggGGT.',
  '..TggGGGpT.',
  '.TgGGGGpT..',
  '.TgGGGpGT..',
  '.TgGpGGT...',
  '.TGpGGT....',
  '..TpTT.....',
  '.Tp........',
  'Tp.........',
];

const BOLT = [
  '.....dddd..',
  '....dyyad..',
  '...dyyad...',
  '..dyyad....',
  '.dyyyddddd.',
  '.dyyyyyyad.',
  '.ddddyyad..',
  '....dyad...',
  '...dyad....',
  '..dyad.....',
  '..ddd......',
];

export function drawElementIcon(element: Element): PixelCanvas {
  const c = new PixelCanvas(ELEMENT_ICON_SIZE, ELEMENT_ICON_SIZE);
  switch (element) {
    case 'AGUA':
      c.paint(union(ellipse(5.5, 7, 4, 3.6), poly([[5.5, 0.5], [2, 6], [9, 6]])), RAMPS.water, {
        form: { cx: 5.5, cy: 6, rx: 4.5, ry: 5 },
      });
      c.set(4, 5, C.white);
      break;
    case 'ROCHA':
      c.paint(poly([[1, 9], [0.5, 5], [3, 2], [7, 1.5], [10.5, 5], [10, 9.5], [6, 10.5]]), RAMPS.stone);
      break;
    case 'FOGO':
      c.paint(poly([[1.5, 10.5], [1, 5], [3, 7], [4, 1], [6, 5], [8, 0.5], [8.5, 6], [10, 4], [10, 10.5]]), RAMPS.flame);
      c.fill(poly([[4, 10], [4.5, 7], [5.5, 8], [6.5, 6], [7.5, 10]]), C.yellow);
      break;
    case 'GELO':
      c.stamp(SNOWFLAKE, 0, 0);
      break;
    case 'GRAMA':
      c.stamp(LEAF, 0, 0);
      break;
    case 'RAIO':
      c.stamp(BOLT, 0, 0);
      break;
  }
  return c;
}

export const ICON_GRIDS = { SNOWFLAKE, LEAF, BOLT };
