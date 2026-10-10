import type { Element } from '../api/types';
import { C, RAMPS, type Ramp } from './palette';
import {
  type Mask, PixelCanvas, ellipse, intersect, line, minus, mirror, poly, shift, superellipse, union,
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
/** Encolhe a forma em 1px: pinta o miolo sem apagar o contorno ja desenhado. */
const shrink = (m: Mask): Mask => (x, y) => m(x, y) && m(x - 1, y) && m(x + 1, y) && m(x, y - 1) && m(x, y + 1);

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

// ---------------------------------------------------------------- Boto (AGUA)

/** O boto cor-de-rosa da lenda: de chapeu branco para esconder o buraco da cabeca. */
const boto: MonsterArt = {
  iconEye: [6, 8],
  draw(c, view, f) {
    const front = view === 'front';
    const body = ellipse(24, 30 + f, 12.5, 14);
    const form = { cx: 24, cy: 30 + f, rx: 13, ry: 15 };
    const belly = ellipse(24, 36 + f, 8.5, 7.5);
    const flippers = sym(poly(f === 0
      ? [[14, 30], [5, 37], [6, 40], [15, 36]]
      : [[14, 30], [4, 33], [5, 36], [15, 35]]));
    const flukes = sym(poly([[24, 40], [14, 41], [9, 45], [12, 46.5], [20, 45.5], [24, 44]]));
    // De frente o bico aponta para a direita; de costas aparece so a ponta, do outro lado.
    const beak = front
      ? poly([[29, 24.5 + f], [37, 26 + f], [42, 27 + f], [44.5, 28.5 + f], [43.5, 30.5 + f], [38, 31.5 + f], [29, 33.5 + f]])
      : poly([[14, 27 + f], [8, 28 + f], [4, 29.5 + f], [5, 31.5 + f], [14, 32 + f]]);
    const jaw = poly([[30, 30 + f], [43.5, 29.5 + f], [42, 31 + f], [37, 32 + f], [30, 33.5 + f]]);
    const crown = superellipse(24, 11 + f, 7, 3.6, 2.6);
    const brim = ellipse(24, 15 + f, 12.5, 2);

    c.paint(flippers, RAMPS.boto);
    if (front) {
      c.paint(flukes, RAMPS.boto, { flat: 2 });
      c.paint(body, RAMPS.boto, { form });
      c.paint(belly, RAMPS.botoBelly, { outline: false });
      c.paint(beak, RAMPS.boto, { flat: 0 });
      c.paint(shrink(jaw), RAMPS.botoBelly, { outline: false });
    } else {
      // De costas o rabo fica na frente do corpo.
      c.paint(beak, RAMPS.boto);
      c.paint(body, RAMPS.boto, { form });
      c.paint(flukes, RAMPS.boto);
    }
    c.paint(crown, RAMPS.snow);
    c.fill(intersect(crown, (_, y) => y >= 12 + f && y < 14 + f), C.night);
    c.paint(brim, RAMPS.snow);
    if (c.scale !== 1) return;

    c.stamp(['44'], 23, 8 + f);
    c.stamp(['6.', '.6'], 14, 19 + f);
    if (front) {
      c.stamp(['.00.', '0660', '0600', '0000', '.00.'], 17, 20 + f);
      c.stamp(['.00.', '0660', '0600', '0000', '.00.'], 24, 20 + f);
      c.stamp(['0.............', '.0000000000000'], 29, 28 + f);
      c.stamp(['ss'], 15, 27 + f);
    }
  },
};

// ---------------------------------------------------------------- PaoDeAcucar (ROCHA)

/** O morro do Rio que tambem e um pao doce: cobertura de acucar no topo e o bondinho pendurado. */
const paodeacucar: MonsterArt = {
  iconEye: [6, 9],
  draw(c, view, f) {
    const front = view === 'front';
    const body = union(ellipse(24, 23 + f, 9.5, 14 - f * 0.5), ellipse(24, 33, 13, 10.5), superellipse(24, 39.5, 15.5, 5, 3));
    const form = { cx: 24, cy: 28, rx: 16, ry: 18 };
    const icing = union(
      ellipse(24, 12 + f, 12, 5.5),
      ellipse(16.5, 17 + f, 2, 3), ellipse(21, 18.5 + f, 2, 3.5), ellipse(27.5, 18 + f, 2, 3), ellipse(31.5, 16.5 + f, 1.8, 2.5),
    );
    // Mata atlantica no pe do morro.
    const bushes = sym(union(ellipse(9.5, 42.5, 3.2, 3), ellipse(12.5, 40, 3, 3), ellipse(14, 44, 3, 2)));
    // Bondinho: cabo saindo do pico e a cabine balancando.
    const side = front ? 1 : -1;
    const gx = 24 + side * (17 + f);
    const cable = line(24 + side * 3, 10 + f, 24 + side * 24, 17, 0.5);
    const hanger = line(24 + side * 17, 14, gx, 20, 0.5);
    const cabin = superellipse(gx, 23.5, 3.5, 3, 4);

    c.paint(body, RAMPS.loaf, { form });
    c.paint(intersect(body, icing), RAMPS.snow, { outline: false, form });
    c.paint(bushes, RAMPS.leaf);
    if (c.scale === 1) {
      c.fill(union(cable, hanger), C.ink);
      c.paint(cabin, RAMPS.gondola);
    }
    if (c.scale !== 1) return;

    // Confeitos coloridos na cobertura.
    c.stamp([
      '..........y......',
      '......r..........',
      '.............g...',
      '...B.....m.......',
      '..............r..',
      '.y.....B.........',
    ], 16, 10 + f);
    c.stamp(['Q6', '66'], gx - 2 + (front ? 0 : 1), 22);
    c.stamp(['b.', 'b.', '.b'], 33, 29);
    if (front) {
      c.stamp(['0000', '0660', '0600', '.00.'], 16, 27 + f, { mirror: true });
      c.stamp(['0....0', '.0000.'], 21, 33);
      c.stamp(['ss'], 13, 32, { mirror: true });
    } else {
      c.stamp(['.b', 'b.', 'b.', '.b'], 16, 27);
      c.stamp(['b', 'b'], 27, 34);
    }
  },
};

// ---------------------------------------------------------------- Pimentinha (FOGO)

/** Pimenta dedo-de-moca e menino levado: talo de topete e a ponta enrolada como rabo. */
const pimentinha: MonsterArt = {
  iconEye: [6, 8],
  draw(c, view, f) {
    const front = view === 'front';
    // De costas a ponta enrolada aparece do outro lado.
    const side = front ? 1 : -1;
    const x = (v: number) => 24 + side * (v - 24);
    const body = union(
      ellipse(23.5, 24 + f, 9.5, 9.5 - f * 0.5),
      ellipse(24, 33, 8.5, 8.5),
      line(x(29), 38, x(35), 42, 2.6),
      line(x(35), 42, x(40), 39, 1.8),
      line(x(40), 39, x(41), 35, 1.3),
    );
    const form = { cx: 23, cy: 29, rx: 13, ry: 16 };
    const feet = union(ellipse(19.5, 43, 2.8, 2), ellipse(26.5, 43.5, 2.8, 2));
    const calyx = union(
      ellipse(23.5, 15.5 + f, 6.5, 2.5),
      poly([[17, 15 + f], [15, 19 + f], [21, 17 + f]]),
      poly([[30, 15 + f], [32, 19 + f], [26, 17 + f]]),
      poly([[22, 16 + f], [23.5, 20 + f], [25, 16 + f]]),
    );
    const stem = union(line(23.5, 15 + f, 25, 8, 1.4), line(25, 8, 29 + f, 5 + f, 1.1));
    const arms = union(ellipse(13.5, 31 + f, 2.5, 3), ellipse(34, 29 - f, 2.5, 3));
    // A ponta do rabo pega fogo (como um pavio).
    const fx = x(41);
    const flame = poly(f === 0
      ? [[fx - 2.5, 35.5], [fx - 2.5, 31], [fx - 1, 32], [fx, 26.5], [fx + 1.5, 31.5], [fx + 2.5, 29.5], [fx + 2.5, 35.5]]
      : [[fx - 2.5, 35.5], [fx - 2.5, 29], [fx - 1, 31], [fx + 0.5, 27.5], [fx + 1.5, 31], [fx + 2.5, 30.5], [fx + 2.5, 35.5]]);

    c.paint(feet, RAMPS.chili, { flat: 2 });
    c.paint(body, RAMPS.chili, { form });
    c.paint(flame, RAMPS.flame);
    c.paint(arms, RAMPS.chili);
    c.paint(stem, RAMPS.leaf);
    c.paint(calyx, RAMPS.leaf);
    if (c.scale !== 1) return;

    // Brilho de casca lisa.
    c.stamp(['.6', '6.', '6.'], 16, 20 + f);
    if (front) {
      c.stamp(['0.....', '.00...', '..00..', '.0660.', '.0600.', '..00..'], 15, 21 + f);
      c.stamp(['.....0', '...00.', '..00..', '.0660.', '.0600.', '..00..'], 26, 21 + f);
      c.stamp(['0........0', '.06666660.', '..000000..'], 19, 30 + f);
      c.stamp(['ss'], 14, 28 + f);
      c.stamp(['ss'], 32, 28 + f);
    } else {
      c.stamp(['R.', '.R', 'R.'], 25, 31 + f);
    }
  },
};

// ---------------------------------------------------------------- Pinguim (GELO)

/** O pinguim de loucas que mora em cima da geladeira, todo brilhante. */
const pinguim: MonsterArt = {
  iconEye: [6, 6],
  draw(c, view, f) {
    const front = view === 'front';
    const head = ellipse(24, 20 + f, 10.5, 9);
    const body = ellipse(24, 33, 13, 11);
    const flippers = sym(poly(f === 0
      ? [[13, 26], [6, 37], [8, 39], [15, 33]]
      : [[13, 26], [4, 33], [6, 36], [15, 32]]));
    const feet = sym(ellipse(18.5, 44.5, 4.5, 2));
    const mask = union(ellipse(24, 34, 9.5, 9.5), sym(ellipse(20.5, 21 + f, 4.5, 5)), ellipse(24, 26 + f, 6, 4));

    c.paint(feet, RAMPS.carrot, { flat: 1 });
    if (!front) c.paint(poly([[20, 40], [24, 46], [28, 40]]), RAMPS.feather);
    c.paint(union(head, body), RAMPS.feather);
    c.paint(flippers, RAMPS.feather);
    if (front) {
      c.paint(mask, RAMPS.snow, { outline: false });
      c.paint(poly([[21, 24 + f], [27, 24 + f], [24, 28 + f]]), RAMPS.carrot);
    }
    if (c.scale !== 1) return;

    // Brilho de louca.
    c.stamp(['.66', '6..', '6..'], 17, 13 + f);
    if (front) {
      c.stamp(['.00.', '0660', '0600', '0000', '.00.'], 18, 18 + f, { mirror: true });
      c.stamp(['ss'], 16, 25 + f, { mirror: true });
    } else {
      // Etiqueta de preco esquecida nas costas.
      c.stamp(['666666', '623326', '666666'], 21, 32);
      c.stamp(['6'], 34, 30);
    }
  },
};

// ---------------------------------------------------------------- Abacaxi (GRAMA)

/** Abacaxi casca grossa, de coroa espetada e cara de poucos amigos. */
const abacaxi: MonsterArt = {
  iconEye: [6, 10],
  draw(c, view, f) {
    const front = view === 'front';
    const body = ellipse(24, 31 + f, 12.5, 12.5);
    const feet = sym(ellipse(18, 44, 3.5, 2));
    const arms = sym(ellipse(11, 35 + f, 2.5, 3));
    const s = f; // a coroa balanca um pouco
    const crown = union(
      poly([[21.5, 21 + f], [24 + s, 3], [26.5, 21 + f]]),
      poly([[20, 21 + f], [15 + s, 6], [24, 19 + f]]),
      poly([[28, 21 + f], [33 + s, 6], [24, 19 + f]]),
      poly([[19, 22 + f], [9 + s, 12], [23, 19 + f]]),
      poly([[29, 22 + f], [39 + s, 12], [25, 19 + f]]),
    );
    // Gomos da casca: losangos em diagonal.
    const diamonds: Mask = (x, y) => (x + y - f) % 6 === 0 || (x - y + f + 60) % 6 === 0;

    c.paint(feet, RAMPS.bark, { flat: 1 });
    c.paint(arms, RAMPS.pineapple);
    c.paint(body, RAMPS.pineapple);
    // De frente os gomos nao passam pela cara.
    const face = front ? ellipse(24, 31 + f, 9.5, 6) : () => false;
    if (c.scale === 1) c.fill(minus(intersect(shrink(body), diamonds), face), C.khaki);
    c.paint(crown, RAMPS.leaf);
    if (c.scale !== 1) return;

    if (front) {
      c.stamp(['0000..', '..0000', '..0660', '..0600', '...00.'], 15, 27 + f, { mirror: true });
      c.stamp(['.....0', '00000.'], 21, 34 + f);
    }
  },
};

// ---------------------------------------------------------------- Gatonet (RAIO)

/** O "gato" de luz em forma de gato: rabo de fio puxado do poste, com garra jacare na ponta. */
const gatonet: MonsterArt = {
  iconEye: [5, 7],
  draw(c, view, f) {
    const front = view === 'front';
    const head = ellipse(24, 20 + f, 12, 9.5);
    const ears = sym(poly([[13, 17 + f], [14, 5 + f], [22, 12 + f]]));
    const body = union(ellipse(24, 37.5, 10.5, 7.5), ellipse(24, 31.5, 8, 5));
    // Sentado: patas da frente na frente da barriga (de costas ficam escondidas).
    const legs = sym(superellipse(20.5, 41.5, 2.6, 3.8, 2.5));
    const side = front ? 1 : -1;
    const tx = (v: number) => 24 + side * (v - 24);
    const tail = union(line(tx(32), 41, tx(40), 40, 1.6), line(tx(40), 40, tx(42 - f), 30, 1.6));
    const clip = superellipse(tx(42 - f), 27, 2.2, 3, 4);

    if (front) c.paint(tail, RAMPS.cable);
    if (front) c.paint(clip, RAMPS.gondola);
    if (!front) c.paint(sym(ellipse(17.5, 44, 3.2, 2)), RAMPS.cat);
    c.paint(body, RAMPS.cat);
    if (front) c.paint(legs, RAMPS.cat);
    c.paint(ears, RAMPS.cat);
    c.paint(head, RAMPS.cat);
    if (!front) {
      c.paint(tail, RAMPS.cable);
      c.paint(clip, RAMPS.gondola);
    }
    if (c.scale !== 1) return;

    // Dentes da garra jacare, faisca e o raio na testa no lugar das listras.
    c.stamp(['5.5'], tx(42 - f) - 1, 23);
    if (f === 1) c.stamp(['.y.', 'y6y', '.y.'], tx(41) - 1, 19);
    c.stamp(['ll.', '.ll'], 16, 35, { mirror: true });
    c.stamp(['ll.', '.ll'], 16, 39, { mirror: true });
    if (front) {
      c.stamp(['..oo', '.oo.', 'oooo', '.oo.', 'oo..'], 22, 11 + f);
      c.stamp(['s.', 'ss'], 16, 9 + f, { mirror: true });
      c.stamp(['.00.', '0g60', '0g00', '0gg0', '.00.'], 17, 17 + f, { mirror: true });
      c.stamp(['..ss..', '0.00.0', '.0..0.'], 21, 24 + f);
      c.stamp(['ll.', '..l', 'll.'], 9, 22 + f, { mirror: true });
    } else {
      c.stamp(['..oo', '.oo.', 'oooo', '.oo.', 'oo..'], 22, 14 + f);
      c.stamp(['ooo..ooo', '..oooo..'], 20, 31);
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
  boto, paodeacucar, pimentinha, pinguim, abacaxi, gatonet,
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
