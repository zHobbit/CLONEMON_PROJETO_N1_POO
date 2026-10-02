import { C, PALETTE } from './art/palette';

/** Resolucao interna (a do Game Boy Advance), escalada por um fator inteiro. */
export const WIDTH = 240;
export const HEIGHT = 160;

export const FONT_FAMILY = '"Press Start 2P"';
export const LINE = 12;

const hex = (index: number) => `#${PALETTE[index].toString(16).padStart(6, '0')}`;

/** Cores da interface, todas da paleta ENDESGA 32 usada na arte. */
export const COLORS = {
  ink: PALETTE[C.night],
  paper: PALETTE[C.white],
  frame: PALETTE[C.ink],
  line: PALETTE[C.steel],
  shadow: PALETTE[C.silver],
  accent: PALETTE[C.red],
  page: PALETTE[C.black],
} as const;

export const CSS = {
  ink: hex(C.night),
  paper: hex(C.white),
  muted: hex(C.steel),
  accent: hex(C.red),
} as const;

export const SCENES = {
  boot: 'Boot',
  title: 'Title',
  login: 'Login',
  starter: 'Starter',
  hub: 'Hub',
  team: 'Team',
  battle: 'Battle',
} as const;
