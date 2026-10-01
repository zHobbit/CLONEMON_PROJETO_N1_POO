import Phaser from 'phaser';
import type { Species } from '../api/types';
import { monsterTexture } from '../art/placeholder';
import { COLORS, SCENES, WIDTH } from '../config';
import { api, catalog } from '../services';
import { onKey } from '../ui/input';
import { Menu } from '../ui/Menu';
import { isDirection, moveCursor } from '../ui/navigation';
import { TextBox } from '../ui/TextBox';
import { addFrame, addText } from '../ui/widgets';

const COLS = 3;
const CELL_W = 80;
const CELL_H = 48;
const TOP = 18;

/** Escolha do primeiro clonemon, numa grade 3x2. */
export class StarterScene extends Phaser.Scene {
  private highlight!: Phaser.GameObjects.Graphics;
  private textBox!: TextBox;
  private index = 0;

  constructor() {
    super(SCENES.starter);
  }

  create(): void {
    this.index = 0;
    this.cameras.main.setBackgroundColor(COLORS.sky);
    addText(this, WIDTH / 2, 4, 'ESCOLHA SEU CLONEMON!').setOrigin(0.5, 0);

    const species = catalog.all();
    this.highlight = this.add.graphics();
    this.textBox = new TextBox(this);
    species.forEach((s, i) => {
      const { x, y } = cell(i);
      const sprite = this.add.image(x + CELL_W / 2, y + 18, monsterTexture(s.id, 'front')).setScale(0.75);
      sprite.setInteractive({ useHandCursor: true }).on('pointerover', () => {
        if (!this.browsing) return;
        this.index = i;
        this.show(species);
      });
      const label = addText(this, x + CELL_W / 2, y + 38, s.name.toUpperCase()).setOrigin(0.5, 0);
      // Nomes longos (ELETROPAULO) nao podem sair da tela.
      label.setX(Phaser.Math.Clamp(label.x, label.width / 2 + 2, WIDTH - label.width / 2 - 2));
    });
    void this.pick(species);
  }

  private browsing = false;

  private async pick(species: Species[]): Promise<void> {
    for (;;) {
      const chosen = await this.browse(species);
      const s = species[chosen];
      this.textBox.setWrapWidth(150);
      this.textBox.setText(`Escolher ${s.name.toUpperCase()}, do tipo ${s.element}?`);
      const frame = addFrame(this, 176, 72, 64, 40);
      const menu = new Menu(this, [{ label: 'SIM' }, { label: 'NAO' }], { x: 182, y: 80, cancellable: true });
      const answer = await menu.choose();
      menu.destroy();
      frame.destroy();
      this.textBox.setWrapWidth(null);
      if (answer !== 0) continue;

      try {
        const starter = await api.chooseStarter(s.id);
        await this.textBox.sayAndWait(`Voce escolheu ${starter.species.toUpperCase()}! Cuide bem dele.`);
        this.scene.start(SCENES.hub);
      } catch {
        await this.textBox.sayAndWait('Nao foi possivel escolher. Tente de novo.');
      }
      return;
    }
  }

  /** Navega pela grade ate o jogador confirmar; devolve o indice escolhido. */
  private browse(species: Species[]): Promise<number> {
    this.browsing = true;
    this.show(species);
    return new Promise((resolve) => {
      const done = () => {
        this.browsing = false;
        off();
        this.input.off('gameobjectdown', done);
        resolve(this.index);
      };
      this.input.on('gameobjectdown', done);
      const off = onKey(this, (k) => {
        if (k === 'confirm') {
          done();
        } else if (isDirection(k)) {
          this.index = moveCursor(this.index, k, species.length, COLS);
          this.show(species);
        }
      });
    });
  }

  private show(species: Species[]): void {
    const { x, y } = cell(this.index);
    this.highlight.clear();
    this.highlight.lineStyle(2, COLORS.accent);
    this.highlight.strokeRect(x + 4, y, CELL_W - 8, CELL_H - 2);
    const s = species[this.index];
    this.textBox.setText(`${s.name.toUpperCase()}  TIPO ${s.element}\nATK ${s.baseAtk}  DEF ${s.baseDef}  VEL ${s.baseSpd}`);
  }
}

function cell(i: number): { x: number; y: number } {
  return { x: (i % COLS) * CELL_W, y: TOP + Math.floor(i / COLS) * CELL_H };
}
