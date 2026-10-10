import { C } from './palette';
import { type Mask, PixelCanvas, ellipse, minus, poly, rect, shift, union } from './raster';

/**
 * Arte do mapa de exploracao: ladrilhos 16x16, predios e balao de exclamacao.
 * Tudo e desenhado em codigo com a paleta do jogo, sem Phaser (testavel em node).
 */

export const TILE_SIZE = 16;
const T = TILE_SIZE;

/** Indice do quadro na folha `world-tiles` (quadros 16x16). */
export enum Tile {
  GRASS = 0, TALL_GRASS = 1, PATH = 2, WATER = 3, TREE = 4, FLOWERS = 5,
  FENCE = 6, SIGN = 7, ROCK = 8, SAND = 9, BRIDGE = 10, TALL_GRASS_FRONT = 11,
}

export const TILE_COUNT = 12;

export const CENTER_SIZE = { width: 80, height: 64 } as const;
export const HOUSE_SIZE = { width: 64, height: 48 } as const;
/** Ladrilho da porta (coluna, linha) dentro de cada predio. */
export const CENTER_DOOR = { col: 2, row: 3 } as const;
export const HOUSE_DOOR = { col: 1, row: 2 } as const;

// ---------------------------------------------------------------- utilitarios

/** Desenha uma grade de caracteres (ver CHARS) com volta nas bordas: padroes que emendam sem costura. */
function stampWrap(c: PixelCanvas, grid: readonly string[], x: number, y: number): void {
  const tmp = new PixelCanvas(c.width, c.height).stamp(grid, 0, 0);
  grid.forEach((row, gy) => {
    for (let gx = 0; gx < row.length; gx++) {
      const color = tmp.get(gx, gy);
      if (color >= 0) c.set((((x + gx) % c.width) + c.width) % c.width, (((y + gy) % c.height) + c.height) % c.height, color);
    }
  });
}

function wrapAt(c: PixelCanvas, points: readonly (readonly [number, number])[], color: number): void {
  for (const [x, y] of points) c.set(((x % c.width) + c.width) % c.width, ((y % c.height) + c.height) % c.height, color);
}

/** Retangulo com borda de 1px. */
function box(c: PixelCanvas, x: number, y: number, w: number, h: number, edge: number, fill: number): void {
  c.fill(rect(x, y, w, h), edge);
  c.fill(rect(x + 1, y + 1, w - 2, h - 2), fill);
}

const blank = () => new PixelCanvas(T, T);

// ---------------------------------------------------------------- ladrilhos

/** Grama base: o fundo de todos os ladrilhos que ficam "em cima" do gramado. */
function grassBase(c: PixelCanvas): void {
  c.fill(rect(0, 0, T, T), C.green);
  const tuft = ['G.G', '.G.'];
  for (const [x, y] of [[2, 2], [10, 0], [13, 7], [5, 8], [9, 12], [0, 13]] as const) stampWrap(c, tuft, x, y);
  wrapAt(c, [[7, 4], [14, 3], [3, 11], [12, 14]], C.forest);
}

function drawGrass(): PixelCanvas {
  const c = blank();
  grassBase(c);
  return c;
}

/** Uma lamina de capim: ponta fina, lado de luz claro, lado de sombra escuro e pe escuro. */
function blade(c: PixelCanvas, x: number, base: number, h: number, lean: number, tones: readonly [number, number, number]): void {
  for (let k = 0; k < h; k++) {
    const y = base - k;
    const dx = k >= h - 2 ? lean : 0;
    if (k === h - 1) {
      c.set(x + dx + (lean > 0 ? 1 : 0), y, tones[0]);
      continue;
    }
    const foot = k < 2;
    c.set(x + dx, y, foot ? tones[2] : tones[0]);
    c.set(x + dx + 1, y, foot ? tones[2] : tones[1]);
  }
}

interface BladeRow {
  base: number;
  xs: readonly number[];
  heights: readonly number[];
  leans: readonly number[];
}

function bladeRow(c: PixelCanvas, row: BladeRow, tones: readonly [number, number, number]): void {
  row.xs.forEach((x, i) => blade(c, x, row.base, row.heights[i % row.heights.length], row.leans[i % row.leans.length], tones));
}

const GRASS_ROWS = {
  back: { base: 7, xs: [0, 2, 4, 6, 8, 10, 12, 14], heights: [8, 6, 7, 8, 6, 7, 8, 6], leans: [-1, 1, 0, 1, -1, 0, 1, -1] },
  mid: { base: 11, xs: [1, 3, 5, 7, 9, 11, 13, 15], heights: [7, 5, 6, 7, 5, 6, 5, 7], leans: [1, -1, 0, -1, 1, 0, -1, 1] },
  front: { base: 15, xs: [0, 2, 4, 6, 8, 10, 12, 14], heights: [7, 5, 6, 8, 5, 6, 8, 5], leans: [-1, 1, 0, 1, -1, 0, 1, -1] },
} as const;

/** Camada da frente do capim alto (laminas claras, so da metade de baixo). */
function tallFront(c: PixelCanvas): void {
  bladeRow(c, GRASS_ROWS.front, [C.green, C.forest, C.pine]);
}

function drawTallGrass(): PixelCanvas {
  const c = blank();
  c.fill(rect(0, 0, T, T), C.pine);
  bladeRow(c, GRASS_ROWS.back, [C.forest, C.pine, C.deepTeal]);
  bladeRow(c, GRASS_ROWS.mid, [C.forest, C.pine, C.deepTeal]);
  tallFront(c);
  return c;
}

function drawTallGrassFront(): PixelCanvas {
  const c = blank();
  tallFront(c);
  return c;
}

function drawPath(): PixelCanvas {
  const c = blank();
  c.fill(rect(0, 0, T, T), C.tan);
  wrapAt(c, [[2, 2], [3, 2], [11, 1], [8, 6], [9, 6], [14, 9], [4, 11], [5, 11], [12, 14], [0, 8]], C.khaki);
  wrapAt(c, [[6, 3], [13, 5], [1, 6], [7, 10], [10, 12], [3, 14]], C.peach);
  wrapAt(c, [[5, 7], [12, 10], [2, 13]], C.cream);
  return c;
}

function drawWater(): PixelCanvas {
  const c = blank();
  c.fill(rect(0, 0, T, T), C.blue);
  for (const [x, y] of [[2, 3], [10, 1], [6, 9], [13, 12]] as const) {
    wrapAt(c, [[x, y], [x + 1, y], [x + 2, y], [x + 3, y]], C.cyan);
    wrapAt(c, [[x + 1, y + 1], [x + 2, y + 1]], C.navy);
  }
  wrapAt(c, [[0, 7], [8, 5], [14, 15], [4, 14]], C.cyan);
  return c;
}

/** Encolhe a forma em 1px (miolo sem o contorno). */
const shrink = (m: Mask): Mask => (x, y) => m(x, y) && m(x - 1, y) && m(x + 1, y) && m(x, y - 1) && m(x, y + 1);

/**
 * Bolha com volume sem pontilhado: contorno, base, faixa de sombra embaixo/direita e de luz em cima/esquerda.
 * tones = [contorno, base, sombra, luz].
 */
function lump(c: PixelCanvas, mask: Mask, tones: readonly [number, number, number, number], band = 1): void {
  const inner = shrink(mask);
  c.fill(mask, tones[0]);
  c.fill(inner, tones[1]);
  c.fill(minus(inner, shift(inner, -band, -band)), tones[2]);
  c.fill(minus(shrink(inner), shift(shrink(inner), band, band)), tones[3]);
}

function drawTree(): PixelCanvas {
  const c = blank();
  grassBase(c);
  c.fill(ellipse(8, 14.5, 6.5, 1.5), C.forest);
  // Tronco com raizes.
  c.stamp([
    '.uuuu.',
    'ukkbbu',
    'ukbbdu',
    'ubbddu',
    'ubbddu',
    'uuuuuu',
  ], 5, 10);
  c.stamp(['u..u'], 6, 15);
  // Copa: tufos de folhas sobrepostos, de tras para frente.
  const leaf = [C.deepTeal, C.forest, C.pine, C.green] as const;
  lump(c, ellipse(8, 4.8, 6.6, 4.6), leaf, 2);
  lump(c, ellipse(3.9, 7.7, 3.9, 4), leaf, 2);
  lump(c, ellipse(12.1, 7.7, 3.9, 4), leaf, 2);
  lump(c, ellipse(8, 9, 6.5, 3.6), leaf, 2);
  return c;
}

function drawRock(): PixelCanvas {
  const c = blank();
  grassBase(c);
  c.fill(ellipse(8, 14, 7.2, 1.8), C.forest);
  const body = union(ellipse(8, 9.2, 6.6, 4.8), ellipse(4.8, 10, 3.8, 3.6), ellipse(11.4, 10.4, 3.8, 3.3));
  lump(c, body, [C.night, C.steel, C.slate, C.silver], 2);
  c.stamp(['6.', '66'], 4, 6);
  c.stamp(['2..', '.2.', '.22'], 9, 8);
  c.stamp(['2', '2'], 6, 11);
  return c;
}
function drawFlowers(): PixelCanvas {
  const c = blank();
  grassBase(c);
  const flower = (x: number, y: number, petal: number) => {
    c.set(x + 1, y, petal);
    c.set(x, y + 1, petal);
    c.set(x + 2, y + 1, petal);
    c.set(x + 1, y + 2, petal);
    c.set(x + 1, y + 1, C.yellow);
  };
  flower(1, 1, C.white);
  flower(9, 2, C.red);
  flower(5, 8, C.magenta);
  flower(12, 10, C.white);
  flower(1, 11, C.red);
  return c;
}

function drawFence(): PixelCanvas {
  const c = blank();
  grassBase(c);
  c.fill(rect(0, 12, T, 2), C.forest);
  const grid = [
    '................', '................', '................', '................',
    '......uuuu......',
    '.....ukkbu......',
    'uuuuuukkbuuuuuuu',
    'kkkkkukkbukkkkkk',
    'bbbbbubbbubbbbbb',
    'dddddubbduddddd.',
    'uuuuuukkbuuuuuuu',
    'kkkkkukkbukkkkkk',
    'bbbbbubbduuuuuuu',
    'dddddubbdu......',
    '.....uuuuu......',
    '................',
  ];
  c.stamp(grid, 0, 0);
  return c;
}

function drawSign(): PixelCanvas {
  const c = blank();
  grassBase(c);
  c.fill(ellipse(8, 14, 6, 1.5), C.forest);
  c.stamp([
    '................',
    '..uuuuuuuuuuuu..',
    '.uttttttttttttu.',
    '.utbbbbbbbbbbtu.',
    '.uttttttttttttu.',
    '.utbbbbbbbbtttu.',
    '.ukkkkkkkkkkkku.',
    '..uuuuubbuuuuu..',
    '......ubbu......',
    '......ubdu......',
    '......ubdu......',
    '......ubdu......',
    '......ubdu......',
    '.....uuddu......',
  ], 0, 0);
  return c;
}

function drawSand(): PixelCanvas {
  const c = blank();
  c.fill(rect(0, 0, T, T), C.cream);
  wrapAt(c, [[2, 2], [11, 1], [7, 6], [14, 8], [4, 11], [10, 13], [0, 9]], C.peach);
  wrapAt(c, [[6, 3], [13, 5], [1, 6], [9, 10], [3, 14]], C.tan);
  wrapAt(c, [[5, 8], [5, 9], [12, 12]], C.khaki);
  return c;
}

function drawBridge(): PixelCanvas {
  const c = blank();
  // So tabuado, sem agua: emenda com outras pontes em qualquer direcao e o rio fica nos ladrilhos vizinhos.
  // Tabuas atravessadas de 4px (brilho, madeira, madeira, fresta), com as pontas desencontradas.
  for (let y = 0; y < T; y++) {
    const row = y % 4;
    c.fill(rect(0, y, T, 1), row === 0 ? C.khaki : row === 3 ? C.darkBrown : C.brown);
  }
  for (let board = 0; board < T / 4; board++) {
    const end = (board * 7 + 3) % T;
    c.fill(rect(end, board * 4, 1, 3), C.darkBrown);
    wrapAt(c, [[end + 1, board * 4 + 1]], C.umber);
  }
  wrapAt(c, [[1, 6], [9, 2], [13, 10], [5, 14]], C.umber);
  return c;
}

const TILE_DRAWERS: Record<Tile, () => PixelCanvas> = {
  [Tile.GRASS]: drawGrass,
  [Tile.TALL_GRASS]: drawTallGrass,
  [Tile.PATH]: drawPath,
  [Tile.WATER]: drawWater,
  [Tile.TREE]: drawTree,
  [Tile.FLOWERS]: drawFlowers,
  [Tile.FENCE]: drawFence,
  [Tile.SIGN]: drawSign,
  [Tile.ROCK]: drawRock,
  [Tile.SAND]: drawSand,
  [Tile.BRIDGE]: drawBridge,
  [Tile.TALL_GRASS_FRONT]: drawTallGrassFront,
};

export function drawTile(tile: Tile): PixelCanvas {
  return TILE_DRAWERS[tile]();
}

/** Todos os ladrilhos, na ordem do enum Tile. */
export function drawAllTiles(): PixelCanvas[] {
  return Array.from({ length: TILE_COUNT }, (_, i) => drawTile(i as Tile));
}

// ---------------------------------------------------------------- predios

/**
 * Telhado de telhas: preenche a forma, contorna e desenha fileiras com juntas alternadas.
 * tones = [luz, base, sombra, contorno].
 */
function roofTiles(c: PixelCanvas, mask: Mask, tones: readonly [number, number, number, number], rowH = 4, jointW = 8): void {
  c.paint(mask, { tones: [tones[1], tones[1], tones[2]], outline: tones[3] }, { flat: 0 });
  let top = Infinity;
  for (let y = 0; y < c.height && top === Infinity; y++) for (let x = 0; x < c.width; x++) if (mask(x, y)) { top = y; break; }
  const solid = shrink(mask);
  for (let y = top; y < c.height; y++) {
    const band = (y - top - 1) % rowH;
    const row = Math.floor((y - top - 1) / rowH);
    for (let x = 0; x < c.width; x++) {
      if (!solid(x, y)) continue;
      if (y - top - 1 < 0) { c.set(x, y, tones[0]); continue; }
      if (band === rowH - 1) c.set(x, y, tones[2]);
      else if ((x + (row % 2) * (jointW / 2)) % jointW === 0) c.set(x, y, tones[2]);
      else if (band === 0) c.set(x, y, tones[1]);
    }
  }
}

/** Janela com moldura clara, vidraca com reflexo e travessas. */
function windowPane(c: PixelCanvas, x: number, y: number, w: number, h: number, mullions = true): void {
  box(c, x, y, w, h, C.umber, C.white);
  c.fill(rect(x + 2, y + 2, w - 4, h - 4), C.blue);
  c.fill(rect(x + 2, y + 2, w - 4, 2), C.cyan);
  if (mullions) {
    c.fill(rect(x + Math.floor(w / 2) - 1, y + 1, 2, h - 2), C.white);
    c.fill(rect(x + 1, y + Math.floor(h / 2) - 1, w - 2, 2), C.white);
  }
  c.set(x + 2, y + 4, C.white);
  c.set(x + 3, y + 3, C.white);
}

/** Parede de tabuas: fundo claro com uma linha mais escura a cada `step` pixels. */
function siding(c: PixelCanvas, x0: number, y0: number, x1: number, y1: number, base: number, line: number, step: number): void {
  for (let y = y0; y <= y1; y++) c.fill(rect(x0, y, x1 - x0 + 1, 1), (y - y0) % step === step - 1 ? line : base);
}

export function drawCenter(): PixelCanvas {
  const { width: W, height: H } = CENTER_SIZE;
  const c = new PixelCanvas(W, H);
  // Parede e alicerce.
  c.fill(rect(4, 24, 72, H - 24), C.umber);
  siding(c, 5, 24, 74, H - 1, C.cream, C.peach, 4);
  c.fill(rect(5, 24, 70, 3), C.tan);
  c.fill(rect(72, 27, 3, H - 27), C.tan);
  c.fill(rect(4, 58, 72, 6), C.slate);
  c.fill(rect(5, 59, 70, 4), C.steel);
  c.fill(rect(5, 59, 70, 1), C.silver);
  for (let x = 5; x < 75; x += 6) c.fill(rect(x, 60, 1, 3), C.slate);
  c.fill(rect(4, 63, 72, 1), C.ink);
  // Janelas dos dois lados, com jardineira.
  for (const x of [11, 55]) {
    windowPane(c, x, 32, 14, 14);
    c.fill(rect(x - 1, 46, 16, 5), C.darkBrown);
    c.fill(rect(x, 46, 14, 1), C.brown);
    for (let i = 0; i < 4; i++) {
      c.set(x + 1 + i * 3 + (i % 2), 45, i % 2 ? C.white : C.red);
      c.set(x + 1 + i * 3 + (i % 2), 44, C.green);
    }
  }
  // Placa com cruz de cura acima da porta.
  box(c, 30, 31, 20, 14, C.umber, C.white);
  c.fill(rect(31, 43, 18, 1), C.silver);
  c.fill(rect(37, 33, 6, 10), C.red);
  c.fill(rect(34, 36, 12, 4), C.red);
  c.fill(rect(38, 34, 1, 8), C.salmon);
  c.fill(rect(35, 37, 10, 1), C.salmon);
  // Porta de vidro (ladrilho CENTER_DOOR): moldura clara e duas folhas.
  box(c, 33, 47, 14, 17, C.umber, C.white);
  for (const gx of [35, 41]) {
    c.fill(rect(gx, 49, 4, 13), C.blue);
    c.fill(rect(gx, 49, 4, 3), C.cyan);
    c.fill(rect(gx, 58, 4, 4), C.navy);
    c.set(gx + 1, 54, C.white);
    c.set(gx + 1, 55, C.white);
    c.set(gx, 56, C.cyan);
  }
  c.fill(rect(39, 49, 2, 13), C.silver);
  c.fill(rect(34, 62, 12, 1), C.ink);
  c.fill(rect(40, 52, 1, 5), C.slate);
  // Telhado vermelho com o emblema.
  roofTiles(c, poly([[10, 1], [70, 1], [79, 25], [0, 25]]), [C.salmon, C.red, C.crimson, C.umber]);
  c.fill(rect(0, 23, W, 2), C.crimson);
  c.fill(rect(0, 25, W, 1), C.umber);
  // Selo branco com um coracao: o simbolo de cura do Centro.
  c.fill(ellipse(40, 13, 7.5, 7.5), C.umber);
  c.fill(ellipse(40, 13, 6.5, 6.5), C.white);
  const heart = ['.##...##.', '####.####', '#########', '#########', '.#######.', '..#####..', '...###...', '....#....'];
  heart.forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) if (row[dx] === '#') c.set(36 + dx, 9 + dy, dy >= 4 || dx >= 7 ? C.crimson : C.red);
  });
  c.set(37, 10, C.salmon);
  c.set(38, 9, C.salmon);
  return c;
}

export function drawHouse(): PixelCanvas {
  const { width: W, height: H } = HOUSE_SIZE;
  const c = new PixelCanvas(W, H);
  // Chaminé atras do telhado.
  c.fill(rect(44, 0, 9, 12), C.umber);
  c.fill(rect(45, 1, 7, 10), C.rust);
  c.fill(rect(45, 1, 7, 2), C.slate);
  c.fill(rect(44, 0, 9, 1), C.ink);
  for (let y = 4; y < 11; y += 3) c.fill(rect(45, y, 7, 1), C.crimson);
  // Parede.
  c.fill(rect(3, 20, 58, H - 20), C.umber);
  siding(c, 4, 20, 59, H - 1, C.cream, C.peach, 4);
  c.fill(rect(4, 20, 56, 3), C.tan);
  c.fill(rect(57, 23, 3, H - 23), C.tan);
  c.fill(rect(3, 44, 58, 4), C.slate);
  c.fill(rect(4, 45, 56, 3), C.steel);
  c.fill(rect(4, 45, 56, 1), C.silver);
  c.fill(rect(3, 47, 58, 1), C.ink);
  // Janela pequena a esquerda e janela grande com venezianas a direita.
  windowPane(c, 6, 29, 10, 12, false);
  c.fill(rect(10, 30, 2, 10), C.white);
  c.fill(rect(7, 34, 8, 1), C.white);
  c.fill(rect(39, 28, 16, 3), C.umber);
  windowPane(c, 40, 28, 14, 13);
  for (const sx of [36, 54]) {
    box(c, sx, 28, 4, 13, C.pine, C.forest);
    for (let y = 30; y < 40; y += 2) c.fill(rect(sx + 1, y, 2, 1), C.pine);
  }
  c.fill(rect(38, 41, 18, 4), C.darkBrown);
  c.fill(rect(39, 41, 16, 1), C.brown);
  for (let i = 0; i < 5; i++) {
    c.set(40 + i * 3, 40, i % 2 ? C.white : C.red);
    c.set(40 + i * 3, 39, C.green);
  }
  // Porta de madeira (ladrilho HOUSE_DOOR).
  box(c, 18, 34, 12, 14, C.umber, C.brown);
  c.fill(rect(19, 35, 10, 12), C.brown);
  c.fill(rect(20, 36, 3, 5), C.darkBrown);
  c.fill(rect(25, 36, 3, 5), C.darkBrown);
  c.fill(rect(20, 42, 3, 4), C.darkBrown);
  c.fill(rect(25, 42, 3, 4), C.darkBrown);
  c.fill(rect(19, 35, 10, 1), C.khaki);
  c.set(27, 41, C.yellow);
  c.fill(rect(17, 46, 14, 1), C.silver);
  c.fill(rect(17, 47, 14, 1), C.ink);
  // Telhado azul.
  roofTiles(c, poly([[8, 5], [55, 5], [63, 22], [0, 22]]), [C.cyan, C.blue, C.navy, C.night], 4, 8);
  c.fill(rect(0, 20, W, 2), C.navy);
  c.fill(rect(0, 22, W, 1), C.night);
  return c;
}

/** Balao de exclamacao que aparece sobre o NPC que viu o jogador. */
export function drawExclaim(): PixelCanvas {
  const c = new PixelCanvas(T, T);
  c.stamp([
    '...0000000000...',
    '..066666666660..',
    '.06666666666660.',
    '.06666666666660.',
    '.06666666666660.',
    '.06666666666660.',
    '.06666666666660.',
    '.06666666666660.',
    '.06666666666660.',
    '..055555555550..',
    '...0000000000...',
    '.....0660.......',
    '......060.......',
    '.......0........',
    '................',
    '................',
  ], 0, 0);
  // O ponto de exclamacao em vermelho (duas colunas: luz e sombra).
  c.fill(rect(7, 2, 1, 4), C.red);
  c.fill(rect(8, 2, 1, 4), C.crimson);
  c.fill(rect(7, 7, 1, 2), C.red);
  c.fill(rect(8, 7, 1, 2), C.crimson);
  return c;
}
