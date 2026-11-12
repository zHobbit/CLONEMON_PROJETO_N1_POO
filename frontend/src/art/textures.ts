import Phaser from 'phaser';
import type { Element, Species } from '../api/types';
import { HEIGHT, WIDTH } from '../config';
import { BACKDROPS, type Backdrop } from '../battle/backdrop';
import { ASSET_URLS, TITLE_ASSET, assetKey, battleAsset, iconAsset, monsterAsset } from './assets';
import { drawElementIcon } from './icons';
import { ICON_SIZE, SPRITE_SIZE, type View, drawIcon, drawMonster } from './monsters';
import { type PixelCanvas, sheet } from './raster';
import { BATTLE_BG, NIGHT_TURF, drawBattleBackground, drawBattlePlatforms, drawMenuTile, drawTitleBackground } from './scenery';

const ELEMENTS: Element[] = ['AGUA', 'ROCHA', 'FOGO', 'GELO', 'GRAMA', 'RAIO'];
const IDLE_FPS = 2;

export const BG = { battle: 'bg-battle', title: 'bg-title', menu: 'bg-menu' } as const;

/** Chave da textura e da animacao de espera do monstro (as duas tem o mesmo nome). */
export function monsterKey(speciesId: number, view: View): string {
  return `mon-${view}-${speciesId}`;
}

export function iconKey(speciesId: number): string {
  return `icon-${speciesId}`;
}

export function elementKey(element: Element): string {
  return `el-${element}`;
}

export function addTexture(scene: Phaser.Scene, key: string, frames: readonly PixelCanvas[]): void {
  if (scene.textures.exists(key)) return;
  const { width, height, rgba } = sheet(frames);
  const tex = scene.textures.createCanvas(key, width, height);
  if (!tex) return;
  tex.getContext().putImageData(new ImageData(rgba as Uint8ClampedArray<ArrayBuffer>, width, height), 0, 0);
  if (frames.length > 1) frames.forEach((f, i) => tex.add(String(i), 0, i * f.width, 0, f.width, f.height));
  tex.refresh();
}

/** Poe na fila de carga do Phaser os PNGs de src/assets. Chamar no preload do Boot. */
export function preloadArt(scene: Phaser.Scene): void {
  for (const [name, url] of Object.entries(ASSET_URLS)) scene.load.image(assetKey(name), url);
}

function sourceImage(scene: Phaser.Scene, asset: string): CanvasImageSource | null {
  const key = assetKey(asset);
  return scene.textures.exists(key) ? (scene.textures.get(key).getSourceImage() as CanvasImageSource) : null;
}

function toCanvas(c: PixelCanvas): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = c.width;
  canvas.height = c.height;
  canvas.getContext('2d')?.putImageData(new ImageData(c.rgba() as Uint8ClampedArray<ArrayBuffer>, c.width, c.height), 0, 0);
  return canvas;
}

/**
 * Monta os dois quadros do monstro a partir de um PNG de um quadro so: o segundo e o mesmo desenho
 * achatado um pixel em direcao aos pes, o mesmo "respirar" da arte feita por codigo.
 */
function addMonsterFromPng(scene: Phaser.Scene, key: string, asset: string): boolean {
  const image = sourceImage(scene, asset);
  if (!image) return false;
  if (scene.textures.exists(key)) return true;
  const size = SPRITE_SIZE;
  const tex = scene.textures.createCanvas(key, size * 2, size);
  if (!tex) return false;
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0);
  ctx.drawImage(image, 0, 0, size, size, size, 1, size, size - 1);
  tex.add('0', 0, 0, 0, size, size);
  tex.add('1', 0, size, 0, size, size);
  tex.refresh();
  return true;
}

function backdropKey(backdrop: Backdrop): string {
  return backdrop === 'field' ? BG.battle : `${BG.battle}-${backdrop}`;
}

/** Textura do cenario pedido; se ele nao tiver PNG, cai no campo, que sempre existe. */
export function battleBackground(scene: Phaser.Scene, backdrop: Backdrop): string {
  const key = backdropKey(backdrop);
  return scene.textures.exists(key) ? key : BG.battle;
}

/** Fundo da batalha em PNG com as plataformas do codigo por cima. */
function addBattleFromPng(scene: Phaser.Scene, backdrop: Backdrop): boolean {
  const image = sourceImage(scene, battleAsset(backdrop));
  if (!image) return false;
  const key = backdropKey(backdrop);
  if (scene.textures.exists(key)) return true;
  const tex = scene.textures.createCanvas(key, BATTLE_BG.width, BATTLE_BG.height);
  if (!tex) return false;
  const ctx = tex.getContext();
  ctx.drawImage(image, 0, 0);
  ctx.drawImage(toCanvas(drawBattlePlatforms(undefined, backdrop === 'night' ? NIGHT_TURF : undefined)), 0, 0);
  tex.refresh();
  return true;
}

/** Copia um PNG de tela cheia para a chave que as cenas usam. */
function addSceneFromPng(scene: Phaser.Scene, key: string, asset: string, width: number, height: number): boolean {
  const image = sourceImage(scene, asset);
  if (!image) return false;
  if (scene.textures.exists(key)) return true;
  const tex = scene.textures.createCanvas(key, width, height);
  if (!tex) return false;
  tex.getContext().drawImage(image, 0, 0);
  tex.refresh();
  return true;
}

/** Registra toda a arte uma vez (no Boot): PNG quando existe, senao o desenho feito por codigo. */
export function registerArt(scene: Phaser.Scene, species: readonly Species[]): void {
  for (const s of species) {
    for (const view of ['front', 'back'] as const) {
      const key = monsterKey(s.id, view);
      if (!addMonsterFromPng(scene, key, monsterAsset(s.name, view)))
        addTexture(scene, key, [drawMonster(s.name, s.element, view, 0), drawMonster(s.name, s.element, view, 1)]);
      if (!scene.anims.exists(key))
        scene.anims.create({ key, frames: [{ key, frame: '0' }, { key, frame: '1' }], frameRate: IDLE_FPS, repeat: -1 });
    }
    if (!addSceneFromPng(scene, iconKey(s.id), iconAsset(s.name), ICON_SIZE, ICON_SIZE)) addTexture(scene, iconKey(s.id), [drawIcon(s.name, s.element)]);
  }
  for (const e of ELEMENTS) addTexture(scene, elementKey(e), [drawElementIcon(e)]);
  for (const backdrop of BACKDROPS) addBattleFromPng(scene, backdrop);
  addTexture(scene, BG.battle, [drawBattleBackground()]);
  if (!addSceneFromPng(scene, BG.title, TITLE_ASSET, WIDTH, HEIGHT)) addTexture(scene, BG.title, [drawTitleBackground()]);
  addTexture(scene, BG.menu, [drawMenuTile()]);
}

/** Sprite do monstro ja com a animacao de espera tocando. */
export function addMonster(scene: Phaser.Scene, x: number, y: number, speciesId: number, view: View): Phaser.GameObjects.Sprite {
  const key = monsterKey(speciesId, view);
  return scene.add.sprite(x, y, key, '0').play(key);
}

export function showMonster(sprite: Phaser.GameObjects.Sprite, speciesId: number, view: View): void {
  sprite.play(monsterKey(speciesId, view));
}

/** Fundo xadrez dos menus, cobrindo a tela toda. */
export function addMenuBackground(scene: Phaser.Scene): Phaser.GameObjects.TileSprite {
  return scene.add.tileSprite(0, 0, scene.scale.width, scene.scale.height, BG.menu).setOrigin(0);
}
