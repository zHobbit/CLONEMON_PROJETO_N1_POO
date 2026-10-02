import Phaser from 'phaser';
import type { Monster } from '../api/types';
import { iconKey } from '../art/textures';
import { COLORS, CSS } from '../config';
import { drawHpBar } from './HpBar';
import { addText } from './widgets';

export const ROW_H = 15;

/** Lista de monstros (icone, nome, nivel, barra de HP). Redesenhada por inteiro a cada mudanca. */
export class MonsterRows {
  private readonly container: Phaser.GameObjects.Container;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly x: number,
    private readonly y: number,
    private readonly width: number,
  ) {
    this.container = scene.add.container(0, 0);
  }

  render(monsters: Monster[], opts: { selected?: number; tag?: (m: Monster) => string } = {}): void {
    this.container.removeAll(true);
    const g = this.scene.add.graphics();
    this.container.add(g);
    monsters.forEach((m, i) => {
      const top = this.y + i * ROW_H;
      if (i === opts.selected) {
        g.fillStyle(COLORS.shadow);
        g.fillRect(this.x, top - 1, this.width, ROW_H);
      }
      const fainted = m.currentHp === 0;
      this.container.add([
        this.scene.add.image(this.x + 8, top + 6, iconKey(m.speciesId)).setAlpha(fainted ? 0.4 : 1),
        addText(this.scene, this.x + 18, top, m.nickname.toUpperCase(), { color: fainted ? CSS.muted : CSS.ink }),
        addText(this.scene, this.x + this.width - 2, top, `${opts.tag?.(m) ?? ''}Nv${m.level}`).setOrigin(1, 0),
      ]);
      drawHpBar(g, this.x + 18, top + 8, 40, m.currentHp, m.maxHp);
    });
  }

  destroy(): void {
    this.container.destroy();
  }
}
