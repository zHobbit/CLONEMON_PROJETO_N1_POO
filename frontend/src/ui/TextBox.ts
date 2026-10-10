import Phaser from 'phaser';
import { audio } from '../audio';
import { COLORS, HEIGHT, WIDTH } from '../config';
import { onKey, waitConfirm } from './input';
import { addText, drawFrame } from './widgets';

const MS_PER_CHAR = 22;

/** Caixa de dialogo com efeito de maquina de escrever e seta de "continuar". */
export class TextBox {
  private readonly text: Phaser.GameObjects.Text;
  private readonly arrow: Phaser.GameObjects.Graphics;
  private readonly fullWidth: number;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly x = 0,
    private readonly y = HEIGHT - 48,
    private readonly w = WIDTH,
    private readonly h = 48,
  ) {
    drawFrame(scene.add.graphics(), x, y, w, h);
    this.fullWidth = w - 16;
    this.text = addText(scene, x + 8, y + 8, '', { lineSpacing: 4, wordWrap: { width: this.fullWidth } });
    this.arrow = scene.add.graphics().setVisible(false);
    this.arrow.fillStyle(COLORS.accent);
    this.arrow.fillTriangle(0, 0, 6, 0, 3, 4);
    this.arrow.setPosition(x + w - 14, y + h - 10);
    scene.tweens.add({ targets: this.arrow, y: this.arrow.y + 2, duration: 300, yoyo: true, repeat: -1 });
  }

  /** Largura util do texto; diminui quando um menu ocupa o lado direito da caixa. */
  setWrapWidth(width: number | null): void {
    this.text.setWordWrapWidth(width ?? this.fullWidth);
  }

  setText(text: string): void {
    this.text.setText(text);
  }

  /** Escreve letra por letra; Enter ou clique completa na hora. */
  say(text: string): Promise<void> {
    const full = this.text.getWrappedText(text).join('\n');
    return new Promise((resolve) => {
      let shown = 0;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        timer.remove();
        off();
        this.scene.input.off('pointerdown', finish);
        this.text.setText(full);
        resolve();
      };
      const timer = this.scene.time.addEvent({
        delay: MS_PER_CHAR,
        loop: true,
        callback: () => {
          shown++;
          this.text.setText(full.slice(0, shown));
          if (shown >= full.length) finish();
        },
      });
      const off = onKey(this.scene, (k) => {
        if (k === 'confirm' || k === 'cancel') finish();
      });
      this.scene.input.once('pointerdown', finish);
      this.text.setText('');
    });
  }

  /** Mostra a seta e espera o jogador continuar. */
  async waitArrow(): Promise<void> {
    this.arrow.setVisible(true);
    await waitConfirm(this.scene);
    audio.sfx('text');
    this.arrow.setVisible(false);
  }

  async sayAndWait(text: string): Promise<void> {
    await this.say(text);
    await this.waitArrow();
  }

  get bounds(): { x: number; y: number; w: number; h: number } {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }
}
