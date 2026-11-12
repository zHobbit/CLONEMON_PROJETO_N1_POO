import type { Backdrop } from '../battle/backdrop';
import type { View } from './monsters';

/**
 * Arte em PNG (src/assets), gerada fora do jogo e convertida por scripts/pixelize.mjs.
 * Quem nao tem PNG continua sendo desenhado por codigo, entao nada aqui e obrigatorio.
 */
const FILES = import.meta.glob<string>('../assets/**/*.png', { eager: true, query: '?url', import: 'default' });

/** Caminho sem a pasta e sem a extensao: '../assets/battle/field.png' vira 'battle/field'. */
export function assetName(path: string): string {
  return path.replace(/^.*\/assets\//, '').replace(/\.png$/, '');
}

/** Nome do asset para a URL que o Vite gerou. */
export const ASSET_URLS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(FILES).map(([path, url]) => [assetName(path), url]),
);

/** Chave da textura do PNG ainda cru, antes de virar a textura que as cenas usam. */
export function assetKey(name: string): string {
  return `png:${name}`;
}

export function monsterAsset(speciesName: string, view: View): string {
  return `monsters/${speciesName.toLowerCase()}-${view}`;
}

export function iconAsset(speciesName: string): string {
  return `monsters/${speciesName.toLowerCase()}-icon`;
}

export function battleAsset(backdrop: Backdrop): string {
  return `battle/${backdrop}`;
}

export const TITLE_ASSET = 'title';
