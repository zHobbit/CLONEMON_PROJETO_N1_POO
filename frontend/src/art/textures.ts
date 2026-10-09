import Phaser from 'phaser';
import type { Element, Species } from '../api/types';
import { drawElementIcon } from './icons';
import { type View, drawIcon, drawMonster } from './monsters';
import { type PixelCanvas, sheet } from './raster';
import { drawBattleBackground, drawMenuTile, drawTitleBackground } from './scenery';

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

function addTexture(scene: Phaser.Scene, key: string, frames: readonly PixelCanvas[]): void {
  if (scene.textures.exists(key)) return;
  const { width, height, rgba } = sheet(frames);
  const tex = scene.textures.createCanvas(key, width, height);
  if (!tex) return;
  tex.getContext().putImageData(new ImageData(rgba as Uint8ClampedArray<ArrayBuffer>, width, height), 0, 0);
  if (frames.length > 1) frames.forEach((f, i) => tex.add(String(i), 0, i * f.width, 0, f.width, f.height));
  tex.refresh();
}

/** Desenha toda a arte uma vez (no Boot) e registra texturas e animacoes no jogo. */
export function registerArt(scene: Phaser.Scene, species: readonly Species[]): void {
  for (const s of species) {
    for (const view of ['front', 'back'] as const) {
      const key = monsterKey(s.id, view);
      addTexture(scene, key, [drawMonster(s.name, s.element, view, 0), drawMonster(s.name, s.element, view, 1)]);
      if (!scene.anims.exists(key))
        scene.anims.create({ key, frames: [{ key, frame: '0' }, { key, frame: '1' }], frameRate: IDLE_FPS, repeat: -1 });
    }
    addTexture(scene, iconKey(s.id), [drawIcon(s.name, s.element)]);
  }
  for (const e of ELEMENTS) addTexture(scene, elementKey(e), [drawElementIcon(e)]);
  addTexture(scene, BG.battle, [drawBattleBackground()]);
  addTexture(scene, BG.title, [drawTitleBackground()]);
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
