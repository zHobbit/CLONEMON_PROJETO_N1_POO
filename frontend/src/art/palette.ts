/**
 * Paleta ENDESGA 32 (lospec.com/palette-list/endesga-32). Toda a arte do jogo usa
 * apenas estas cores, referenciadas pelo indice.
 */
export const PALETTE = [
  0xbe4a2f, 0xd77643, 0xead4aa, 0xe4a672, 0xb86f50, 0x733e39, 0x3e2731, 0xa22633,
  0xe43b44, 0xf77622, 0xfeae34, 0xfee761, 0x63c74d, 0x3e8948, 0x265c42, 0x193c3e,
  0x124e89, 0x0099db, 0x2ce8f5, 0xffffff, 0xc0cbdc, 0x8b9bb4, 0x5a6988, 0x3a4466,
  0x262b44, 0x181425, 0xff0044, 0x68386c, 0xb55088, 0xf6757a, 0xe8b796, 0xc28569,
] as const;

export const C = {
  rust: 0, clay: 1, cream: 2, tan: 3, brown: 4, darkBrown: 5, umber: 6, crimson: 7,
  red: 8, orange: 9, amber: 10, yellow: 11, green: 12, forest: 13, pine: 14, deepTeal: 15,
  navy: 16, blue: 17, cyan: 18, white: 19, silver: 20, steel: 21, slate: 22, ink: 23,
  night: 24, black: 25, magenta: 26, plum: 27, mauve: 28, salmon: 29, peach: 30, khaki: 31,
} as const;

/** Um caractere por cor, para desenhar detalhes a mao em grades de texto. '.' e transparente. */
export const CHARS: Readonly<Record<string, number>> = {
  '0': C.black, '1': C.night, '2': C.ink, '3': C.slate, '4': C.steel, '5': C.silver, '6': C.white,
  r: C.red, R: C.crimson, m: C.magenta, o: C.orange, a: C.amber, y: C.yellow,
  c: C.cream, t: C.tan, k: C.khaki, b: C.brown, d: C.darkBrown, u: C.umber, f: C.rust, l: C.clay,
  g: C.green, G: C.forest, p: C.pine, T: C.deepTeal,
  n: C.navy, B: C.blue, Q: C.cyan,
  P: C.plum, M: C.mauve, s: C.salmon, e: C.peach,
};

/** Rampa de um material: tons do mais claro ao mais escuro, mais a cor do contorno. */
export interface Ramp {
  readonly tones: readonly number[];
  readonly outline: number;
}

export const RAMPS = {
  water: { tones: [C.cyan, C.blue, C.navy], outline: C.night },
  stone: { tones: [C.silver, C.steel, C.slate, C.ink], outline: C.night },
  moss: { tones: [C.green, C.forest, C.pine], outline: C.deepTeal },
  devil: { tones: [C.salmon, C.red, C.crimson], outline: C.umber },
  flame: { tones: [C.yellow, C.amber, C.orange], outline: C.rust },
  horn: { tones: [C.cream, C.tan, C.khaki], outline: C.darkBrown },
  wing: { tones: [C.mauve, C.plum], outline: C.night },
  snow: { tones: [C.white, C.silver, C.steel], outline: C.slate },
  carrot: { tones: [C.amber, C.orange, C.rust], outline: C.darkBrown },
  twig: { tones: [C.brown, C.darkBrown], outline: C.umber },
  bark: { tones: [C.khaki, C.brown, C.darkBrown], outline: C.umber },
  leaf: { tones: [C.green, C.forest, C.pine], outline: C.deepTeal },
  volt: { tones: [C.yellow, C.amber, C.orange], outline: C.darkBrown },
  metal: { tones: [C.white, C.silver, C.steel], outline: C.slate },
  cable: { tones: [C.slate, C.ink, C.night], outline: C.black },
  cap: { tones: [C.white, C.silver, C.steel], outline: C.ink },
  boto: { tones: [C.salmon, C.mauve, C.plum], outline: C.night },
  botoBelly: { tones: [C.peach, C.salmon], outline: C.mauve },
  loaf: { tones: [C.peach, C.khaki, C.brown], outline: C.umber },
  gondola: { tones: [C.red, C.crimson], outline: C.umber },
  chili: { tones: [C.salmon, C.red, C.crimson], outline: C.umber },
  feather: { tones: [C.slate, C.ink, C.night], outline: C.black },
  pineapple: { tones: [C.yellow, C.amber, C.tan], outline: C.darkBrown },
  cat: { tones: [C.yellow, C.amber, C.orange], outline: C.darkBrown },
} as const satisfies Record<string, Ramp>;

export function toRgb(index: number): [number, number, number] {
  const hex = PALETTE[index];
  return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
}
