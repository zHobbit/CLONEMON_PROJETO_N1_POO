import Phaser from 'phaser';
import type { Element, Species } from '../api/types';
import { HEIGHT, WIDTH } from '../config';
import { BACKDROPS, type Backdrop } from '../battle/backdrop';
import { ASSET_URLS, TITLE_ASSET, assetKey, battleAsset, hdAsset, iconAsset, monsterAsset } from './assets';
import { drawElementIcon } from './icons';
import { C, PALETTE } from './palette';
import { ICON_SIZE, SPRITE_SIZE, type View, drawIcon, drawMonster } from './monsters';
import { type PixelCanvas, sheet } from './raster';
import { BATTLE_BG, NIGHT_TURF, drawBattleBackground, drawBattlePlatforms, drawMenuTile, drawTitleBackground } from './scenery';

const ELEMENTS: Element[] = ['AGUA', 'ROCHA', 'FOGO', 'GELO', 'GRAMA', 'RAIO'];
const IDLE_FPS = 2;

export const BG = { battle: 'bg-battle', title: 'bg-title', menu: 'bg-menu' } as const;

/** Tamanho da arte HD (scripts/pixelize.mjs): sprites e icones 8x, cenarios 6x. */
const HD_SPRITE = SPRITE_SIZE * 8;
const HD_ICON = ICON_SIZE * 8;
const HD_SCENE = 6;

/**
 * Escala de exibicao de cada textura HD: o jogo pensa em 240x160, entao um sprite de 384 px aparece
 * com 48 de tamanho e a camera ampliada mostra os pixels dele de verdade. Texturas fora daqui valem 1.
 */
const SCALES = new Map<string, number>();

export function artScale(key: string): number {
  return SCALES.get(key) ?? 1;
}

/** Imagem de uma textura da arte (cenario, icone), ja no tamanho do jogo. */
export function addArt(scene: Phaser.Scene, x: number, y: number, key: string): Phaser.GameObjects.Image {
  return scene.add.image(x, y, key).setScale(artScale(key));
}

/** Textura HD: filtro suave (o resto do jogo e pixel art, sem suavizacao) e escala de exibicao. */
function markHd(tex: Phaser.Textures.CanvasTexture, key: string, scale: number): void {
  tex.refresh();
  tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
  SCALES.set(key, scale);
}

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

/** Os dois quadros do monstro em HD, como em addMonsterFromPng: o segundo achatado 1 pixel do jogo. */
function addMonsterFromHd(scene: Phaser.Scene, key: string, asset: string): boolean {
  const image = sourceImage(scene, hdAsset(asset));
  if (!image) return false;
  if (scene.textures.exists(key)) return true;
  const size = HD_SPRITE;
  const squash = HD_SPRITE / SPRITE_SIZE;
  const tex = scene.textures.createCanvas(key, size * 2, size);
  if (!tex) return false;
  const ctx = tex.getContext();
  ctx.drawImage(image, 0, 0);
  ctx.drawImage(image, 0, 0, size, size, size, squash, size, size - squash);
  tex.add('0', 0, 0, 0, size, size);
  tex.add('1', 0, size, 0, size, size);
  markHd(tex, key, SPRITE_SIZE / HD_SPRITE);
  return true;
}

/** Uma imagem HD inteira (icone, titulo) copiada para a chave que as cenas usam. */
function addImageFromHd(scene: Phaser.Scene, key: string, asset: string, width: number, height: number, scale: number): boolean {
  const image = sourceImage(scene, hdAsset(asset));
  if (!image) return false;
  if (scene.textures.exists(key)) return true;
  const tex = scene.textures.createCanvas(key, width, height);
  if (!tex) return false;
  tex.getContext().drawImage(image, 0, 0);
  markHd(tex, key, scale);
  return true;
}

/**
 * As duas plataformas da batalha desenhadas na resolucao HD, nas mesmas posicoes e tamanhos das de
 * pixel (drawBattlePlatforms): elipse de base mais escura, topo com degrade e uma borda.
 */
function drawHdPlatforms(ctx: CanvasRenderingContext2D, s: number, night: boolean): void {
  const css = (i: number) => `#${PALETTE[i].toString(16).padStart(6, '0')}`;
  const [light, mid, dark] = night ? [C.forest, C.pine, C.deepTeal] : [C.green, C.forest, C.pine];
  const spots = [
    { ...BATTLE_BG.enemy, rx: 46, ry: 10 },
    { ...BATTLE_BG.player, rx: 56, ry: 12 },
  ];
  for (const { x, y, rx, ry } of spots) {
    ctx.beginPath();
    ctx.ellipse(x * s, (y + 3) * s, rx * s, ry * s, 0, 0, Math.PI * 2);
    ctx.fillStyle = css(dark);
    ctx.fill();
    const top = ctx.createRadialGradient(x * s, (y - ry / 2) * s, 0, x * s, y * s, rx * s);
    top.addColorStop(0, css(light));
    top.addColorStop(1, css(mid));
    ctx.beginPath();
    ctx.ellipse(x * s, y * s, (rx - 2) * s, (ry - 2) * s, 0, 0, Math.PI * 2);
    ctx.fillStyle = top;
    ctx.fill();
    ctx.lineWidth = s * 0.75;
    ctx.strokeStyle = css(dark);
    ctx.stroke();
  }
}

/** Cenario HD com as plataformas desenhadas por cima. */
function addBattleFromHd(scene: Phaser.Scene, backdrop: Backdrop): boolean {
  const image = sourceImage(scene, hdAsset(battleAsset(backdrop)));
  if (!image) return false;
  const key = backdropKey(backdrop);
  if (scene.textures.exists(key)) return true;
  const tex = scene.textures.createCanvas(key, BATTLE_BG.width * HD_SCENE, BATTLE_BG.height * HD_SCENE);
  if (!tex) return false;
  const ctx = tex.getContext();
  ctx.drawImage(image, 0, 0);
  drawHdPlatforms(ctx, HD_SCENE, backdrop === 'night');
  markHd(tex, key, 1 / HD_SCENE);
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

/** Registra toda a arte uma vez (no Boot): HD, senao PNG de pixels, senao o desenho feito por codigo. */
export function registerArt(scene: Phaser.Scene, species: readonly Species[]): void {
  for (const s of species) {
    for (const view of ['front', 'back'] as const) {
      const key = monsterKey(s.id, view);
      if (!addMonsterFromHd(scene, key, monsterAsset(s.name, view)) && !addMonsterFromPng(scene, key, monsterAsset(s.name, view)))
        addTexture(scene, key, [drawMonster(s.name, s.element, view, 0), drawMonster(s.name, s.element, view, 1)]);
      if (!scene.anims.exists(key))
        scene.anims.create({ key, frames: [{ key, frame: '0' }, { key, frame: '1' }], frameRate: IDLE_FPS, repeat: -1 });
    }
    const icon = iconKey(s.id);
    if (!addImageFromHd(scene, icon, iconAsset(s.name), HD_ICON, HD_ICON, ICON_SIZE / HD_ICON) && !addSceneFromPng(scene, icon, iconAsset(s.name), ICON_SIZE, ICON_SIZE))
      addTexture(scene, icon, [drawIcon(s.name, s.element)]);
  }
  for (const e of ELEMENTS) addTexture(scene, elementKey(e), [drawElementIcon(e)]);
  for (const backdrop of BACKDROPS) if (!addBattleFromHd(scene, backdrop)) addBattleFromPng(scene, backdrop);
  addTexture(scene, BG.battle, [drawBattleBackground()]);
  if (!addImageFromHd(scene, BG.title, TITLE_ASSET, WIDTH * HD_SCENE, HEIGHT * HD_SCENE, 1 / HD_SCENE) && !addSceneFromPng(scene, BG.title, TITLE_ASSET, WIDTH, HEIGHT))
    addTexture(scene, BG.title, [drawTitleBackground()]);
  addTexture(scene, BG.menu, [drawMenuTile()]);
}

/** Sprite do monstro ja com a animacao de espera tocando. */
export function addMonster(scene: Phaser.Scene, x: number, y: number, speciesId: number, view: View): Phaser.GameObjects.Sprite {
  const key = monsterKey(speciesId, view);
  return scene.add.sprite(x, y, key, '0').setScale(artScale(key)).play(key);
}

/** Troca o monstro do sprite (a escala acompanha: uma especie pode ter arte HD e outra nao). */
export function showMonster(sprite: Phaser.GameObjects.Sprite, speciesId: number, view: View): void {
  const key = monsterKey(speciesId, view);
  sprite.setScale(artScale(key)).play(key);
}

/** Fundo xadrez dos menus, cobrindo a tela toda. */
export function addMenuBackground(scene: Phaser.Scene): Phaser.GameObjects.TileSprite {
  return scene.add.tileSprite(0, 0, WIDTH, HEIGHT, BG.menu).setOrigin(0);
}
