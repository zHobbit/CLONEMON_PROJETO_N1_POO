import Phaser from 'phaser';
import type { Element } from '../api/types';
import { HIT_FX_FRAMES, drawHitEffect } from '../art/effects';
import { addTexture } from '../art/textures';

const ELEMENTS: Element[] = ['AGUA', 'ROCHA', 'FOGO', 'GELO', 'GRAMA', 'RAIO'];
const FPS = 14;

/** Chave da textura e da animacao do efeito de golpe de um elemento. */
export function hitEffectKey(element: Element): string {
  return `fx-hit-${element}`;
}

/** Desenha os efeitos de golpe (no Boot, junto com o resto da arte). */
export function registerEffectArt(scene: Phaser.Scene): void {
  for (const e of ELEMENTS) {
    const key = hitEffectKey(e);
    addTexture(scene, key, Array.from({ length: HIT_FX_FRAMES }, (_, f) => drawHitEffect(e, f)));
    if (!scene.anims.exists(key)) {
      const frames = Array.from({ length: HIT_FX_FRAMES }, (_, f) => ({ key, frame: String(f) }));
      scene.anims.create({ key, frames, frameRate: FPS, repeat: 0 });
    }
  }
}

/** Toca o efeito uma vez em (x, y) e some. Nao bloqueia: roda junto com o piscar do alvo. */
export function playHitEffect(scene: Phaser.Scene, element: Element, x: number, y: number): void {
  const key = hitEffectKey(element);
  if (!scene.anims.exists(key)) return;
  const fx = scene.add.sprite(Math.round(x), Math.round(y), key, '0').setDepth(10);
  fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => fx.destroy());
  fx.play(key);
}
