import { PixelCanvas } from './raster';

/**
 * Personagens do mapa: quadros 16x24, 3 colunas (parado, passo A, passo B) x 4 linhas
 * (baixo, esquerda, direita, cima). Cada quadro e montado em camadas a partir de grades
 * de "papeis" (O contorno, H cabelo, F pele, T camisa, P calca...), recoloridos por personagem.
 * A direita e a esquerda espelhada.
 */

export type CharacterId = 'player' | 'caio' | 'bia' | 'zeca';
export type Direction = 'down' | 'left' | 'right' | 'up';
export type Step = 0 | 1 | 2;

export const CHAR_W = 16;
export const CHAR_H = 24;
export const CHARACTER_IDS: readonly CharacterId[] = ['player', 'caio', 'bia', 'zeca'];
export const DIRECTIONS: readonly Direction[] = ['down', 'left', 'right', 'up'];

export type View = 'down' | 'left' | 'up';
type PerView<T> = Readonly<Record<View, T>>;
export interface Overlay {
  readonly x: number;
  readonly y: number;
  readonly grid: readonly string[];
}

export interface CharacterSpec {
  /** Papel -> caractere da paleta (ver CHARS); o que nao esta aqui vale o padrao de BASE_ROLES. */
  readonly roles: Readonly<Record<string, string>>;
  /** Linhas 0..11: cabeca (e chapeu/cabelo). */
  readonly head: PerView<readonly string[]>;
  /** Linhas 12..17 (troca o tronco padrao). */
  readonly torso?: Partial<PerView<readonly string[]>>;
  /** Detalhes por cima da cabeca e do tronco (mochila, rabo de cavalo, saia...); y absoluto, em pe. */
  readonly extras?: Partial<PerView<readonly Overlay[]>>;
}

/** Papeis comuns a todos: cada personagem so troca o que muda. */
export const BASE_ROLES: Readonly<Record<string, string>> = {
  O: 'u', // contorno
  H: 'd', h: 'b', // cabelo e luz do cabelo
  F: 'e', f: 'k', E: '0', // pele, sombra da pele, olho
  T: 'B', t: 'n', a: 'n', // camisa, sombra, manga (so na vista lateral)
  A: '1', Y: 'a', // cinto e fivela
  P: '3', p: '2', L: '3', l: '2', // calca, sombra, parte de baixo da perna e sombra
  Z: '5', // sapato
  C: 'r', c: 'R', s: 's', W: '6', w: '5', D: 'G', // chapeu/bone, sombra, brilho, branco, barba, faixa
  K: 'M', N: 'P', // saia e sombra
  B: 'G', b: 'p', V: 'g', S: 't', // mochila, sombra, luz e alca
};

// ---------------------------------------------------------------- partes comuns

const TORSO: PerView<readonly string[]> = {
  down: [
    '...OTTTTTTTTO...',
    '..OTtTTTTTTtTO..',
    '..OTtTTTTTTtTO..',
    '..OFOTTTTTTOFO..',
    '...OOTTTTTTOO...',
    '....OAAYYAAO....',
  ],
  left: [
    '....OTTTTTTO....',
    '....OTTTTTtO....',
    '....OTTTTTtO....',
    '....OTTTTTtO....',
    '....OTTTTTtO....',
    '....OAAAAAAO....',
  ],
  up: [
    '...OTTTTTTTTO...',
    '..OTtTTTTTTtTO..',
    '..OTtTTTTTTtTO..',
    '..OFOTTTTTTOFO..',
    '...OOTTTTTTOO...',
    '....OAAAAAAO....',
  ],
};

/** Pernas: parado (linhas 18..23) e passos A/B (linhas 19..23: o corpo desce 1px). */
const LEGS: PerView<readonly (readonly string[])[]> = {
  down: [
    [
      '....OPPOOPpO....',
      '....OPPOOPpO....',
      '....OLLOOLlO....',
      '....OLLOOLlO....',
      '...OZZZOOZZZO...',
      '...OOOOOOOOOO...',
    ],
    [
      '....OPPOOPpO....',
      '....OPPOOPpO....',
      '....OLLOOZZO....',
      '...OZZZOOOOO....',
      '...OOOOO........',
    ],
    [
      '....OPPOOPpO....',
      '....OPPOOPpO....',
      '....OZZOOLlO....',
      '....OOOOOZZZO...',
      '........OOOOO...',
    ],
  ],
  left: [
    [
      '....OPPPPPpO....',
      '....OPPPPPpO....',
      '....OLLLLLlO....',
      '....OLLLLLlO....',
      '..OZZZZZZZZO....',
      '..OOOOOOOOOO....',
    ],
    [
      '....OPPPPPpO....',
      '...OPPPPOPPpO...',
      '..OLLLLO.OLLlO..',
      '.OZZZZO...OZZZO.',
      '.OOOOO....OOOOO.',
    ],
    [
      '....OPPPPPpO....',
      '....OPPPPPpO....',
      '...OLLLOOLLlO...',
      '..OZZZZO.OZZO...',
      '..OOOOO..OOOO...',
    ],
  ],
  up: [
    [
      '....OPPOOPpO....',
      '....OPPOOPpO....',
      '....OLLOOLlO....',
      '....OLLOOLlO....',
      '...OZZZOOZZZO...',
      '...OOOOOOOOOO...',
    ],
    [
      '....OPPOOPpO....',
      '....OPPOOPpO....',
      '....OLLOOZZO....',
      '...OZZZOOOOO....',
      '...OOOOO........',
    ],
    [
      '....OPPOOPpO....',
      '....OPPOOPpO....',
      '....OZZOOLlO....',
      '....OOOOOZZZO...',
      '........OOOOO...',
    ],
  ],
};

/** Braco na vista lateral: balanca para frente (esquerda) no passo A e para tras no B. */
const SIDE_ARM = ['aa', 'aa', 'aa', 'FF'] as const;
const SIDE_ARM_X: Readonly<Record<Step, number>> = { 0: 6, 1: 5, 2: 8 };

// ---------------------------------------------------------------- personagens

const PLAYER: CharacterSpec = {
  roles: { C: 'r', c: 'R', T: 'B', t: 'n', a: 'n', P: '3', L: '3', p: '2', l: '2', Z: '5', A: '1' },
  head: {
    down: [
      '................',
      '.....OOOOOO.....',
      '....OCsCCCCO....',
      '...OCsCCCCCCO...',
      '...OCCCWWCCCO...',
      '..OCCCCCCCCCCO..',
      '..OccccccccccO..',
      '..OHFFFFFFFFHO..',
      '..OHFEFFFFEFHO..',
      '..OHFEFFFFEFHO..',
      '...OFFFffFFFO...',
      '....OFFFFFFO....',
    ],
    left: [
      '................',
      '....OOOOOOO.....',
      '...OCsCCCCCCO...',
      '..OCsCCCCCCCCO..',
      '..OCCCCCCCCCCO..',
      '.OccccCCCCCCCO..',
      '.OOOFFFHHHHHHO..',
      '..OFEFFHHHHHHO..',
      '.OFFEFFfHHHHHO..',
      '..OFFFFfHHHHO...',
      '...OffFFHHHO....',
      '....OFFFFOO.....',
    ],
    up: [
      '................',
      '.....OOOOOO.....',
      '....OCsCCCCO....',
      '...OCsCCCCCCO...',
      '...OCCCCCCCCO...',
      '..OCCCCCCCCCCO..',
      '..OccccccccccO..',
      '..OHHHHHHHHHHO..',
      '..OHhhHHHHHHHO..',
      '..OHHHHHHHHHHO..',
      '...OHHHHHHHHO...',
      '....OHHHHHHO....',
    ],
  },
};

const CAIO: CharacterSpec = {
  roles: { H: '1', h: '3', T: 'a', t: 'o', a: 'o', A: 'n', Y: 'n', P: 'n', p: '1', L: 'e', l: 'k', Z: 'r', V: 'g', B: 'G', b: 'p', S: 'c' },
  head: {
    down: [
      '................',
      '....OOOOOOOO....',
      '...OHhhHHHHHO...',
      '..OHhHHHHHHHHO..',
      '..OHHHHHHHHHHO..',
      '..OHHFHHHHFHHO..',
      '..OHFFFFFFFFHO..',
      '..OHFEFFFFEFHO..',
      '..OHFEFFFFEFHO..',
      '...OFFFFFFFFO...',
      '...OFFFffFFFO...',
      '....OFFFFFFO....',
    ],
    left: [
      '................',
      '....OOOOOOO.....',
      '...OHhhHHHHHO...',
      '..OHhHHHHHHHHO..',
      '..OHHHHHHHHHHO..',
      '..OHHHHHHHHHHO..',
      '..OFFFFHHHHHHO..',
      '..OFEFFHHHHHHO..',
      '.OFFEFFfHHHHHO..',
      '..OFFFFfHHHHO...',
      '...OffFFHHHO....',
      '....OFFFFOO.....',
    ],
    up: [
      '................',
      '....OOOOOOOO....',
      '...OHhhHHHHHO...',
      '..OHhHHHHHHHHO..',
      '..OHHHHHHHHHHO..',
      '..OHHHHHHHHHHO..',
      '..OHHHHHHHHHHO..',
      '..OHHHhHHHHHHO..',
      '..OHHHHHHHHHHO..',
      '...OHHHHHHHHO...',
      '...OHHHHHHHHO...',
      '....OHHHHHHO....',
    ],
  },
  torso: {
    down: [
      '...OTTTTTTTTO...',
      '..OTtTTTTTTtTO..',
      '..OTtooooootTO..',
      '..OFOTTTTTTOFO..',
      '...OOTTTTTTOO...',
      '....OAAAAAAO....',
    ],
    left: [
      '....OTTTTTTO....',
      '....OTTTTTtO....',
      '....OooooootO...',
      '....OTTTTTtO....',
      '....OTTTTTtO....',
      '....OAAAAAAO....',
    ],
  },
  extras: {
    down: [{
      x: 0, y: 12, grid: [
        '.....S....S.....',
        '.....S....S.....',
        '.....S....S.....',
        '.....S....S.....',
        '.....S....S.....',
      ],
    }],
    left: [{
      x: 10, y: 12, grid: [
        '.OOO..',
        'OVVBO.',
        'OVBBbO',
        'OBSSbO',
        'OBSSbO',
        'OBBbbO',
        'OBbbbO',
        '.OOOO.',
      ],
    }],
    up: [{
      x: 0, y: 12, grid: [
        '....OOOOOOOO....',
        '....OVVVVVBO....',
        '....OVBBBBbO....',
        '....OBBBBBbO....',
        '....OBSSSSbO....',
        '....OBSSSSbO....',
        '....OBbbbbbO....',
        '....OOOOOOOO....',
      ],
    }],
  },
};

const BIA: CharacterSpec = {
  roles: { H: 'b', h: 'l', T: 's', t: 'M', a: 'e', A: 'M', P: 'e', p: 'k', L: 'e', l: 'k', Z: 'M', K: 'M', N: 'P', S: 't' },
  head: {
    down: [
      '................',
      '.....OOOOOO.....',
      '....OHhhHHHO....',
      '...OHhhHHHHHO...',
      '..OHhHHHHHHHHO..',
      '..OHHHHHHHHHHO..',
      '..OHHHFFFFHHHO..',
      '..OHHFFFFFFHHO..',
      '..OHFEFFFFEFHO..',
      '..OHFEFFFFEFHO..',
      '...OHFFffFFHO...',
      '....OHFFFFHO....',
    ],
    left: [
      '................',
      '.....OOOOOO.....',
      '....OHhhHHHHO...',
      '...OHhHHHHHHHO..',
      '..OHHHHHHHHHHHO.',
      '..OHHHHHHHHHHHO.',
      '..OFFFFHHHHHHHO.',
      '..OFFFFHHHHHHHO.',
      '.OFFEFFHHHHHHHO.',
      '..OFFFFHHHHHHO..',
      '...OffFFHHHHO...',
      '....OFFFFHHO....',
    ],
    up: [
      '................',
      '.....OOOOOO.....',
      '....OHhhHHHO....',
      '...OHhHHHHHHO...',
      '..OHHHHHHHHHHO..',
      '..OHHHHHHHHHHO..',
      '..OHHHHHHHHHHO..',
      '..OHHHHHHHHHHO..',
      '..OHHHHHHHHHHO..',
      '..OHHHHHHHHHHO..',
      '...OHHHHHHHHO...',
      '....OHHHHHHO....',
    ],
  },
  torso: {
    down: [
      '...OTTTTTTTTO...',
      '..OTtTTTTTTtTO..',
      '..OFfTTTTTTfFO..',
      '..OFOTTTTTTOFO..',
      '...OOTTTTTTOO...',
      '....OKKKKKKO....',
    ],
    left: [
      '....OTTTTTTO....',
      '....OTTTTTtO....',
      '....OTTTTTtO....',
      '....OTTTTTtO....',
      '....OTTTTTtO....',
      '....OKKKKKKO....',
    ],
    up: [
      '...OTTTTTTTTO...',
      '..OTtTTTTTTtTO..',
      '..OFfTTTTTTfFO..',
      '..OFOTTTTTTOFO..',
      '...OOTTTTTTOO...',
      '....OKKKKKKO....',
    ],
  },
  extras: {
    down: [
      { x: 0, y: 2, grid: ['............mm..', '............mmm.', '.............OHO', '.............OHO', '.............OHO', '.............OHO', '..............O.'] },
      { x: 0, y: 18, grid: ['...OKKKKKKKKO...', '..ONNNNNNNNNNO..'] },
    ],
    left: [
      { x: 0, y: 2, grid: ['.............mm.', '............mmmO', '...........OHHHO', '...........OHHO.', '............OHO.', '.............O..'] },
      { x: 0, y: 18, grid: ['...OKKKKKKKKO...', '..ONNNNNNNNNNO..'] },
    ],
    up: [
      {
        x: 0, y: 1, grid: [
          '......mm.mm.....',
          '.......mm.......',
          '.......hh.......',
          '......hhhH......',
          '......hhhH......',
          '......hhhH......',
          '......hhhH......',
          '......hhhH......',
          '......hhhH......',
          '.....OhhhHO.....',
          '......OhhHO.....',
          '......OhHHO.....',
          '.......OHO......',
          '........O.......',
        ],
      },
      { x: 0, y: 18, grid: ['...OKKKKKKKKO...', '..ONNNNNNNNNNO..'] },
    ],
  },
};

const ZECA: CharacterSpec = {
  roles: { C: 't', c: 'k', s: 'c', D: 'G', H: '5', h: '6', W: '6', w: '5', T: 'G', t: 'p', a: 'p', A: 'd', Y: 'a', P: 'b', p: 'd', L: 'b', l: 'd', Z: 'd', S: 'k' },
  head: {
    down: [
      '................',
      '....OOOOOOOO....',
      '...OCssCCCCCO...',
      '...OCCCCCCCCO...',
      '...ODDDDDDDDO...',
      '.OOCCCCCCCCCCOO.',
      '..OccccccccccO..',
      '...OHffffffHO...',
      '...OHFEFFEFHO...',
      '...OHFEFFEFHO...',
      '...OWWWWWWWWO...',
      '...OWWwWWwWWO...',
    ],
    left: [
      '................',
      '....OOOOOOOO....',
      '...OCssCCCCCO...',
      '...OCCCCCCCCO...',
      '...ODDDDDDDDO...',
      '.OOCCCCCCCCCCOO.',
      '..OccccccccccO..',
      '..OffffHHHHHO...',
      '..OFEFFHHHHHO...',
      '.OFFEFFHHHHHO...',
      '.OWWWWWHHHHO....',
      '..OWWwWWHHO.....',
    ],
    up: [
      '................',
      '....OOOOOOOO....',
      '...OCssCCCCCO...',
      '...OCCCCCCCCO...',
      '...ODDDDDDDDO...',
      '.OOCCCCCCCCCCOO.',
      '..OccccccccccO..',
      '...OHHHHHHHHO...',
      '...OHHHHHHHHO...',
      '...OHHHHHHHHO...',
      '...O4HHHHHH4O...',
      '....O4HHHH4O....',
    ],
  },
  extras: {
    down: [{
      x: 0, y: 12, grid: ['....OWWWWWWO....', '.....OWWWWO.....', '......OWWO......'],
    }],
    left: [{
      x: 0, y: 12, grid: ['...OWWWWO.......', '....OWWO........'],
    }],
  },
};

export const CHARACTERS: Readonly<Record<CharacterId, CharacterSpec>> = {
  player: PLAYER,
  caio: CAIO,
  bia: BIA,
  zeca: ZECA,
};

// ---------------------------------------------------------------- montagem

/** Troca cada papel pelo caractere da paleta; o que nao e papel (ex.: 'o', '0') passa direto. */
export function recolor(grid: readonly string[], roles: Readonly<Record<string, string>>): string[] {
  return grid.map((row) => [...row].map((ch) => roles[ch] ?? BASE_ROLES[ch] ?? ch).join(''));
}

function flipX(c: PixelCanvas): PixelCanvas {
  const out = new PixelCanvas(c.width, c.height);
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) out.set(c.width - 1 - x, y, c.get(x, y));
  return out;
}

/** Um quadro do personagem: direcao e passo (0 parado, 1 passo A, 2 passo B). */
export function drawCharacterFrame(id: CharacterId, dir: Direction, step: Step): PixelCanvas {
  const spec = CHARACTERS[id];
  const view: View = dir === 'right' ? 'left' : dir;
  const c = new PixelCanvas(CHAR_W, CHAR_H);
  const bob = step === 0 ? 0 : 1;
  const put = (grid: readonly string[], x: number, y: number) => c.stamp(recolor(grid, spec.roles), x, y);
  put(LEGS[view][step], 0, step === 0 ? 18 : 19);
  put(spec.head[view], 0, bob);
  put(spec.torso?.[view] ?? TORSO[view], 0, 12 + bob);
  if (view === 'left') put(SIDE_ARM, SIDE_ARM_X[step], 13 + bob);
  for (const o of spec.extras?.[view] ?? []) put(o.grid, o.x, o.y + bob);
  return dir === 'right' ? flipX(c) : c;
}

/** Quadros na ordem da folha: indice = linha * 3 + coluna (linhas: baixo, esq, dir, cima). */
export function drawCharacterFrames(id: CharacterId): PixelCanvas[] {
  const frames: PixelCanvas[] = [];
  for (const dir of DIRECTIONS) for (const step of [0, 1, 2] as const) frames.push(drawCharacterFrame(id, dir, step));
  return frames;
}

/** Folha do personagem 48x96 (3 colunas x 4 linhas de quadros 16x24), pronta para virar textura. */
export function characterSheet(id: CharacterId): { width: number; height: number; rgba: Uint8ClampedArray } {
  const width = CHAR_W * 3;
  const height = CHAR_H * 4;
  const rgba = new Uint8ClampedArray(width * height * 4);
  drawCharacterFrames(id).forEach((frame, i) => {
    const data = frame.rgba();
    const col = i % 3;
    const row = Math.floor(i / 3);
    for (let y = 0; y < CHAR_H; y++) {
      rgba.set(data.subarray(y * CHAR_W * 4, (y + 1) * CHAR_W * 4), ((row * CHAR_H + y) * width + col * CHAR_W) * 4);
    }
  });
  return { width, height, rgba };
}
