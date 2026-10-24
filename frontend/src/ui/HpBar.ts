import Phaser from 'phaser';
import { COLORS } from '../config';
import { hpColor, hpFillWidth } from './hp';

/** Cor da faixa "fantasma": o HP que acabou de ser perdido, antes de sumir. */
const GHOST_COLOR = 0xf8f0d8;
const GHOST_HOLD_MS = 400;
const GHOST_FADE_MS = 300;

/** Barra de HP com rotulo "HP" e animacao de dano/cura. No dano, o trecho perdido fica claro por um instante. */
export class HpBar {
  private readonly g: Phaser.GameObjects.Graphics;
  private current = 0;
  private max = 1;
  private ghost = 0;
  private ghostTween?: Phaser.Tweens.Tween;

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

  get maxHp(): number {
    return this.max;
  }

  set(hp: number, max: number, animate = false): Promise<void> {
    this.max = max;
    this.ghostTween?.stop();
    if (!animate || hp === this.current) {
      this.current = hp;
      this.ghost = hp;
      this.draw(hp);
      return Promise.resolve();
    }
    // Perdeu HP: a faixa fantasma comeca no valor antigo e so encolhe depois da barra.
    this.ghost = hp < this.current ? this.current : hp;
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
          this.fadeGhost(hp);
          resolve();
        },
      });
    });
  }

  private fadeGhost(hp: number): void {
    if (this.ghost <= hp) return;
    this.ghostTween = this.scene.tweens.addCounter({
      from: this.ghost,
      to: hp,
      delay: GHOST_HOLD_MS,
      duration: GHOST_FADE_MS,
      onUpdate: (tw) => {
        this.ghost = tw.getValue() ?? hp;
        this.draw(this.current);
      },
    });
  }

  private draw(hp: number): void {
    this.g.clear();
    drawHpBar(this.g, this.x, this.y, this.width, hp, this.max, this.ghost);
    this.onChange?.(hp);
  }
}

/**
 * "HP" em pixels (nao depende da fonte), trilho escuro e preenchimento colorido. Ocupa width + 18 px.
 * `ghost` acima de `hp` desenha o trecho perdido numa cor clara.
 */
export function drawHpBar(
  g: Phaser.GameObjects.Graphics, x: number, y: number, width: number, hp: number, max: number, ghost = hp,
): void {
  g.fillStyle(COLORS.frame);
  g.fillRect(x, y, width + 18, 6);
  g.fillStyle(0xf8d048);
  for (const [px, py] of HP_LABEL) g.fillRect(x + px, y + py, 1, 1);
  g.fillStyle(0x505070);
  g.fillRect(x + 16, y + 1, width, 4);
  if (ghost > hp) {
    g.fillStyle(GHOST_COLOR);
    g.fillRect(x + 16, y + 1, hpFillWidth(ghost, max, width), 4);
  }
  g.fillStyle(hpColor(hp, max));
  g.fillRect(x + 16, y + 1, hpFillWidth(hp, max, width), 4);
}

const HP_LABEL = [
  [2, 1], [2, 2], [2, 3], [2, 4], [3, 2], [4, 1], [4, 2], [4, 3], [4, 4],
  [7, 1], [7, 2], [7, 3], [7, 4], [8, 1], [9, 2], [8, 3],
];
