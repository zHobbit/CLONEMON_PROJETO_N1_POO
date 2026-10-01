import type { Element } from './api/types';

/** Resolucao interna (a do Game Boy Advance), escalada por um fator inteiro. */
export const WIDTH = 240;
export const HEIGHT = 160;

export const FONT_FAMILY = '"Press Start 2P"';
export const LINE = 12;

export const COLORS = {
  ink: 0x1b1b2f,
  paper: 0xf8f8f0,
  frame: 0x3a3a5c,
  shadow: 0xc8c8d8,
  accent: 0xe03c3c,
  sky: 0xc8e8f8,
  ground: 0x98d070,
  groundDark: 0x68a048,
  page: 0x101820,
} as const;

export const CSS = {
  ink: '#1b1b2f',
  paper: '#f8f8f0',
  muted: '#9a9ab0',
  accent: '#e03c3c',
} as const;

export const ELEMENT_COLORS: Record<Element, number> = {
  AGUA: 0x4890f0,
  ROCHA: 0xa08860,
  FOGO: 0xf06030,
  GELO: 0x88e0f0,
  GRAMA: 0x58c048,
  RAIO: 0xf8d030,
};

export const SCENES = {
  boot: 'Boot',
  title: 'Title',
  login: 'Login',
  starter: 'Starter',
  hub: 'Hub',
  team: 'Team',
  battle: 'Battle',
} as const;
