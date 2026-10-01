import Phaser from 'phaser';
import { COLORS, CSS, FONT_FAMILY } from '../config';

export function addText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  style: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, { fontFamily: FONT_FAMILY, fontSize: '8px', color: CSS.ink, ...style });
}

/** Caixa no estilo GBA: borda escura com cantos recortados e fundo claro. */
export function drawFrame(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number): void {
  g.fillStyle(COLORS.frame);
  g.fillRect(x + 1, y, w - 2, h);
  g.fillRect(x, y + 1, w, h - 2);
  g.fillStyle(COLORS.paper);
  g.fillRect(x + 2, y + 2, w - 4, h - 4);
  g.fillStyle(COLORS.shadow);
  g.fillRect(x + 2, y + h - 3, w - 4, 1);
}

export function addFrame(scene: Phaser.Scene, x: number, y: number, w: number, h: number): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  drawFrame(g, x, y, w, h);
  return g;
}

/** Promessa que resolve quando o tween termina. */
export function tween(scene: Phaser.Scene, config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
  return new Promise((resolve) => {
    scene.tweens.add({ ...config, onComplete: () => resolve() });
  });
}

export function delay(scene: Phaser.Scene, ms: number): Promise<void> {
  return new Promise((resolve) => scene.time.delayedCall(ms, resolve));
}
