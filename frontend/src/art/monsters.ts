import type { Element } from '../api/types';
import { C, RAMPS, type Ramp } from './palette';
import {
  type Mask, PixelCanvas, ellipse, intersect, line, mirror, poly, shift, superellipse, union,
} from './raster';

export type View = 'front' | 'back';
export type Frame = 0 | 1;

export const SPRITE_SIZE = 48;
export const ICON_SIZE = 16;
const W = SPRITE_SIZE;

/**
 * Cada clonemon e desenhado com formas sombreadas + detalhes feitos a mao.
 * O quadro 1 da animacao de espera mexe as formas um pouco (respirar, chama, galhos...).
 * Em icones (escala 3) os detalhes finos sao trocados por 2 pixels de olhos.
 */
interface MonsterArt {
  draw(c: PixelCanvas, view: View, frame: Frame): void;
  /** Olho esquerdo no icone 16x16 (o direito e espelhado). */
  iconEye: readonly [number, number];
}

const sym = (m: Mask) => mirror(m, W);

// ---------------------------------------------------------------- Lindoya (AGUA)

const lindoya: MonsterArt = {
  iconEye: [6, 10],
  draw(c, view, f) {
    const cy = 32 + f;
    const rx = 15 + f * 0.6;
    const ry = 13 - f;
    const tipY = 7 + f * 2;
    const baseY = cy - 0.8 * ry;
    const half = rx * 0.6;
    const body = union(ellipse(24, cy, rx, ry), poly([[24, tipY], [24 - half, baseY + 1], [24 + half, baseY + 1]]));
    const form = { cx: 24, cy: cy - 3, rx: rx + 1, ry: ry + 4 };

    c.paint(sym(ellipse(9.5, 35 + f, 3.5, 4.5)), RAMPS.water);
    c.paint(body, RAMPS.water, { form });
    c.paint(superellipse(24, tipY + 1.5, 4.5, 2.5, 6), RAMPS.cap);
    if (c.scale !== 1) return;

    c.stamp(['4.4'], 20, tipY + 1, { mirror: true });
    if (view === 'front') {
      c.stamp(['.66', '6Q.', '6..', 'Q..'], 13, 23 + f);
      c.stamp(['.00.', '0660', '0600', '0000', '0nn0', '.00.'], 17, 27 + f, { mirror: true });
      c.stamp(['ss'], 14, 34 + f, { mirror: true });
      c.stamp(['0..0', '.00.'], 22, 35 + f);
    } else {
      c.stamp(['.66', '6Q.', '6..'], 13, 23 + f);
      c.stamp(['.n..n.', 'n.nn.n'], 21, 33 + f);
    }
  },
};

// ---------------------------------------------------------------- Coiso (ROCHA)

const coiso: MonsterArt = {
  iconEye: [6, 9],
  draw(c, view, f) {
    const rock = shift(poly([
      [10, 41], [7, 33], [8, 23], [13, 15], [20, 10], [28, 10], [35, 14], [40, 22], [41, 32], [38, 41], [30, 44], [18, 44],
    ]), 0, f);
    const form = { cx: 24, cy: 26 + f, rx: 18, ry: 19 };
    const mossCap = view === 'front'
      ? union(ellipse(18, 12 + f, 7, 4), ellipse(26, 10 + f, 7, 3.5), ellipse(32, 13 + f, 5, 3))
      : union(ellipse(17, 13 + f, 9, 6), ellipse(27, 11 + f, 9, 5), ellipse(34, 16 + f, 6, 4));
    const fists = sym(ellipse(7, 34 + f, 4, 4.5));

    c.paint(sym(ellipse(17, 44, 4.5, 3)), RAMPS.stone);
    if (view === 'back') c.paint(fists, RAMPS.stone);
    c.paint(rock, RAMPS.stone, { form });
    c.paint(intersect(rock, mossCap), RAMPS.moss, { outline: false, form });
    if (view === 'front') c.paint(fists, RAMPS.stone);
    if (c.scale !== 1) return;

    c.stamp(['2..', '.2.', '.22', '..2'], 33, 27 + f);
    c.stamp(['2.', '22', '.2'], 12, 36 + f);
    if (view === 'front') {
      c.stamp(['00....', '.0000.', '..0660', '..0600', '...00.'], 14, 24 + f, { mirror: true });
      c.stamp(['..0000..', '.0....0.', '0......0'], 20, 34 + f);
    } else {
      c.stamp(['.2.', '2.2', '.2.'], 19, 30 + f);
      c.stamp(['g.', '.g'], 21, 9 + f);
    }
  },
};

// ---------------------------------------------------------------- Lucifer (FOGO)

const lucifer: MonsterArt = {
  iconEye: [6, 10],
  draw(c, view, f) {
    const body = ellipse(24, 31 + f, 13, 13);
    const wingL: [number, number][] = view === 'front'
      ? [[13, 26], [2, 16], [4, 24], [1, 30], [6, 31], [5, 36], [13, 34]]
      : [[16, 27], [1, 12], [3, 22], [0, 29], [5, 30], [4, 37], [16, 35]];
    const wings = sym(shift(poly(wingL), 0, f));
    const horns = sym(shift(poly([[14, 22], [9, 9], [11, 9], [18, 19]]), 0, f));
    const flame = shift(poly(f === 0
      ? [[18, 21], [19, 12], [21, 16], [23, 7], [25, 15], [28, 10], [29, 16], [31, 13], [30, 21]]
      : [[18, 21], [17, 13], [21, 15], [24, 8], [26, 14], [29, 11], [29, 17], [32, 14], [30, 21]]), 0, f);
    // De costas o rabo aparece do outro lado, por fora do corpo.
    const tail = view === 'front'
      ? union(line(34, 40, 42, 33, 1.6), poly([[41, 27], [46, 35], [38, 34]]))
      : union(line(13, 40, 5, 33, 1.6), poly([[6, 27], [1, 35], [9, 34]]));

    if (view === 'front') {
      c.paint(wings, RAMPS.wing);
      c.paint(tail, RAMPS.devil);
    }
    c.paint(sym(ellipse(18, 44, 4, 2.5)), RAMPS.devil, { flat: 2 });
    c.paint(body, RAMPS.devil);
    c.paint(horns, RAMPS.horn);
    c.paint(flame, RAMPS.flame);
    c.paint(sym(ellipse(11, 34 + f, 3, 3.5)), RAMPS.devil);
    if (view === 'back') {
      c.paint(wings, RAMPS.wing);
      c.paint(tail, RAMPS.devil);
    }
    if (c.scale !== 1) return;

    if (view === 'front') {
      c.stamp(['00....', '.0000.', '.0y0y0', '..000.'], 15, 26 + f, { mirror: true });
      c.stamp(['0........0', '.00000000.', '..6....6..'], 19, 34 + f);
      c.stamp(['s'], 15, 32 + f, { mirror: true });
    } else {
      c.stamp(['R.', '.R'], 20, 36 + f);
    }
  },
};

// ---------------------------------------------------------------- Olaf (GELO)

const olaf: MonsterArt = {
  iconEye: [6, 5],
  draw(c, view, f) {
    const lower = ellipse(24, 36, 14, 10);
    const head = ellipse(24, 18 + f, 10, 9);
    const armUp = f === 0 ? line(12, 30, 4, 21, 1) : line(12, 30, 3, 25, 1);
    const armDown = line(36, 31, 44, 35, 1);
    const arms = view === 'front' ? union(armUp, armDown) : union(line(36, 30, 44, 21 + f * 4, 1), line(12, 31, 4, 35, 1));

    c.paint(lower, RAMPS.snow);
    // Galhos finos viram pontos soltos no icone.
    if (c.scale === 1) c.paint(arms, RAMPS.twig, { outline: false, flat: 1 });
    c.paint(head, RAMPS.snow);
    if (view === 'front') c.paint(poly([[23, 19 + f], [34, 21 + f], [23, 23 + f]]), RAMPS.carrot);
    else c.paint(poly([[33, 20 + f], [37, 21 + f], [33, 22 + f]]), RAMPS.carrot, { outline: false, flat: 1 });
    if (c.scale !== 1) return;

    c.stamp(['d.d', '.d.', '.d.'], 21, 6 + f);
    c.stamp(['d..', '.dd'], 26, 7 + f);
    if (view === 'front') {
      c.stamp(['d.', 'd.'], 4 - f, 19 + f * 4);
      c.stamp(['000.', '....', '.00.', '0060', '0000', '.00.'], 18, 11 + f, { mirror: true });
      c.stamp(['0......0', '.000000.', '...66...'], 20, 24 + f);
      c.stamp(['00', '00', '..', '..', '..', '00', '00'], 23, 31);
    }
  },
};

// ---------------------------------------------------------------- Groot (GRAMA)

const groot: MonsterArt = {
  iconEye: [6, 9],
  draw(c, view, f) {
    const sway = f;
    const canopy = view === 'front'
      ? union(ellipse(16 + sway, 16, 8, 6.5), ellipse(32 + sway, 15, 8, 6.5), ellipse(24 + sway, 10, 9, 6.5), ellipse(24 + sway, 19, 10, 4))
      : union(ellipse(15 + sway, 18, 9, 8), ellipse(33 + sway, 17, 9, 8), ellipse(24 + sway, 11, 11, 8), ellipse(24 + sway, 23, 12, 5));
    const arms = union(line(14, 28, 6, 20 - f, 1.6), line(34, 30, 41, 37, 1.6));
    const leaves = union(ellipse(5, 18 - f, 3, 2.5), ellipse(42.5, 38.5, 2.5, 2));
    const full = c.scale === 1;

    c.paint(union(sym(ellipse(16, 44, 4, 2.5)), ellipse(24, 45, 2.5, 2)), RAMPS.bark);
    if (full && view === 'back') c.paint(arms, RAMPS.bark);
    c.paint(superellipse(24, 32, 11, 13, 3), RAMPS.bark);
    if (full && view === 'front') c.paint(arms, RAMPS.bark);
    if (full) c.paint(leaves, RAMPS.leaf);
    c.paint(canopy, RAMPS.leaf);
    if (c.scale !== 1) return;

    c.stamp(['d', 'd', '.', 'd'], 15, 31);
    c.stamp(['d', 'd', 'd'], 33, 36);
    c.stamp(['.m.', 'mym', '.m.'], 29 + sway, 8);
    if (view === 'front') {
      c.stamp(['.00.', '0660', '0600', '.00.'], 18, 27, { mirror: true });
      c.stamp(['0....0', '.0000.'], 21, 34);
    } else {
      c.stamp(['.dd.', 'd00d', '.dd.'], 22, 33);
      c.stamp(['d', 'd'], 28, 28);
    }
  },
};

// ---------------------------------------------------------------- EletroPaulo (RAIO)

const eletropaulo: MonsterArt = {
  iconEye: [6, 9],
  draw(c, view, f) {
    const body = superellipse(24, 29 + f, 16, 15, 3.2);
    const prongs = sym(superellipse(18, 9 + f, 2, 5.5, 6));
    const cable = view === 'front'
      ? union(line(33, 42, 40, 44, 1.5), line(40, 44, 44, 38, 1.5))
      : union(line(24, 32, 24, 45, 1.5), line(24, 45, 33, 46, 1.5));

    if (view === 'front') c.paint(cable, RAMPS.cable);
    c.paint(prongs, RAMPS.metal);
    c.paint(sym(ellipse(17, 45, 4, 2)), RAMPS.volt, { flat: 2 });
    c.paint(body, RAMPS.volt);
    c.paint(sym(ellipse(7, 32 + f, 3, 3.5)), RAMPS.volt);
    if (view === 'front') c.paint(ellipse(24, 30 + f, 10, 10), RAMPS.metal);
    else c.paint(cable, RAMPS.cable);
    if (c.scale !== 1) return;

    if (f === 1) c.stamp(['.y..', 'yy6y', '..y.'], 22, 3);
    if (view === 'front') {
      c.stamp(['.00.', '0000', '0060', '0000', '.00.'], 17, 24 + f, { mirror: true });
      c.stamp(['.00.', '0000', '0000', '.00.'], 22, 32 + f);
      c.stamp(['ss'], 10, 32 + f, { mirror: true });
      c.stamp(['.o', 'o.', '.o'], 36, 18 + f);
    } else {
      c.stamp(['.4.', '454', '.4.'], 22, 24 + f);
      c.stamp(['o.', '.o', 'o.'], 12, 20 + f);
    }
  },
};

// ---------------------------------------------------------------- generico

const ELEMENT_RAMP: Record<Element, Ramp> = {
  AGUA: RAMPS.water, ROCHA: RAMPS.stone, FOGO: RAMPS.flame, GELO: RAMPS.snow, GRAMA: RAMPS.leaf, RAIO: RAMPS.volt,
};

/** Para especies novas que ainda nao tem arte: uma bolha na cor do elemento. */
function generic(element: Element): MonsterArt {
  return {
    iconEye: [6, 9],
    draw(c, view, f) {
      c.paint(ellipse(24, 30 + f, 16, 14 - f), ELEMENT_RAMP[element]);
      if (c.scale === 1 && view === 'front') c.stamp(['.00.', '0660', '0600', '.00.'], 17, 26 + f, { mirror: true });
    },
  };
}

const ART: Record<string, MonsterArt> = {
  lindoya, coiso, lucifer, olaf, groot, eletropaulo,
};

function artFor(name: string, element: Element): MonsterArt {
  return ART[name.toLowerCase()] ?? generic(element);
}

export function hasCustomArt(name: string): boolean {
  return name.toLowerCase() in ART;
}

export function drawMonster(name: string, element: Element, view: View, frame: Frame): PixelCanvas {
  const c = new PixelCanvas(SPRITE_SIZE, SPRITE_SIZE);
  artFor(name, element).draw(c, view, frame);
  return c;
}

export function drawIcon(name: string, element: Element): PixelCanvas {
  const art = artFor(name, element);
  const c = new PixelCanvas(ICON_SIZE, ICON_SIZE, SPRITE_SIZE / ICON_SIZE);
  art.draw(c, 'front', 0);
  const [x, y] = art.iconEye;
  c.set(x, y, C.black);
  c.set(ICON_SIZE - 1 - x, y, C.black);
  return c;
}
