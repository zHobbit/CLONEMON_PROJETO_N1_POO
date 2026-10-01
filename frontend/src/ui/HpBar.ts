import Phaser from 'phaser';
import { COLORS } from '../config';
import { hpColor, hpFillWidth } from './hp';

/** Barra de HP com rotulo "HP" e animacao de dano/cura. */
export class HpBar {
  private readonly g: Phaser.GameObjects.Graphics;
  private current = 0;
  private max = 1;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly x: number,
    private readonly y: number,
    private readonly width = 48,
    private readonly onChange?: (hp: number) => void,
  ) {
    this.g = scene.add.graphics();
  }

  get value(): number {
    return this.current;
  }

  set(hp: number, max: number, animate = false): Promise<void> {
    this.max = max;
    if (!animate || hp === this.current) {
      this.current = hp;
      this.draw(hp);
      return Promise.resolve();
    }
    const duration = Phaser.Math.Clamp((Math.abs(hp - this.current) / Math.max(1, max)) * 900, 250, 900);
    return new Promise((resolve) => {
      this.scene.tweens.addCounter({
        from: this.current,
        to: hp,
        duration,
        onUpdate: (tw) => this.draw(tw.getValue() ?? hp),
        onComplete: () => {
          this.current = hp;
          this.draw(hp);
          resolve();
        },
      });
    });
  }

  private draw(hp: number): void {
    this.g.clear();
    drawHpBar(this.g, this.x, this.y, this.width, hp, this.max);
    this.onChange?.(hp);
  }
}

/** "HP" em pixels (nao depende da fonte), trilho escuro e preenchimento colorido. Ocupa width + 18 px. */
export function drawHpBar(g: Phaser.GameObjects.Graphics, x: number, y: number, width: number, hp: number, max: number): void {
  g.fillStyle(COLORS.frame);
  g.fillRect(x, y, width + 18, 6);
  g.fillStyle(0xf8d048);
  for (const [px, py] of HP_LABEL) g.fillRect(x + px, y + py, 1, 1);
  g.fillStyle(0x505070);
  g.fillRect(x + 16, y + 1, width, 4);
  g.fillStyle(hpColor(hp, max));
  g.fillRect(x + 16, y + 1, hpFillWidth(hp, max, width), 4);
}

const HP_LABEL = [
  [2, 1], [2, 2], [2, 3], [2, 4], [3, 2], [4, 1], [4, 2], [4, 3], [4, 4],
  [7, 1], [7, 2], [7, 3], [7, 4], [8, 1], [9, 2], [8, 3],
];
