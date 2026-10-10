import Phaser from 'phaser';
import { audio } from '../audio';
import { CSS, LINE } from '../config';
import { onKey } from './input';
import { isDirection, moveCursor } from './navigation';
import { addText } from './widgets';

export interface MenuOption {
  label: string;
  disabled?: boolean;
}

export interface MenuConfig {
  x: number;
  y: number;
  columns?: number;
  colWidth?: number;
  rowHeight?: number;
  /** Esc devolve null. */
  cancellable?: boolean;
  initial?: number;
  onHover?: (index: number) => void;
}

/** Lista de opcoes com cursor, navegavel por teclado ou mouse. */
export class Menu {
  private readonly texts: Phaser.GameObjects.Text[];
  private readonly cursor: Phaser.GameObjects.Text;
  private index: number;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: MenuOption[],
    private readonly cfg: MenuConfig,
  ) {
    const columns = cfg.columns ?? 1;
    const colWidth = cfg.colWidth ?? 80;
    const rowHeight = cfg.rowHeight ?? LINE;
    this.texts = options.map((o, i) =>
      addText(scene, cfg.x + 10 + (i % columns) * colWidth, cfg.y + Math.floor(i / columns) * rowHeight, o.label, {
        color: o.disabled ? CSS.muted : CSS.ink,
      }),
    );
    this.cursor = addText(scene, 0, 0, '>');
    this.index = Math.min(cfg.initial ?? 0, options.length - 1);
    this.select(this.index);
  }

  get selected(): number {
    return this.index;
  }

  choose(): Promise<number | null> {
    return new Promise((resolve) => {
      const finish = (value: number | null) => {
        off();
        audio.sfx(value === null ? 'cancel' : 'confirm');
        for (const t of this.texts) t.removeAllListeners().disableInteractive();
        resolve(value);
      };
      const pick = (i: number) => {
        if (!this.options[i].disabled) finish(i);
      };
      const off = onKey(this.scene, (k) => {
        if (k === 'confirm') pick(this.index);
        else if (k === 'cancel') {
          if (this.cfg.cancellable) finish(null);
        } else if (isDirection(k)) {
          this.select(moveCursor(this.index, k, this.options.length, this.cfg.columns ?? 1));
        }
      });
      this.texts.forEach((t, i) => {
        t.setInteractive({ useHandCursor: true });
        t.on('pointerover', () => this.select(i));
        t.on('pointerdown', () => pick(i));
      });
    });
  }

  destroy(): void {
    for (const t of this.texts) t.destroy();
    this.cursor.destroy();
  }

  private select(i: number): void {
    if (i !== this.index) audio.sfx('cursor');
    this.index = i;
    const t = this.texts[i];
    this.cursor.setPosition(t.x - 9, t.y);
    this.cfg.onHover?.(i);
  }
}
