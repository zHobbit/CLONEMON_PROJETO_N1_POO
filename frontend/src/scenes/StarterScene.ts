import Phaser from 'phaser';
import type { Species } from '../api/types';
import { addMenuBackground, addMonster, elementKey } from '../art/textures';
import { audio } from '../audio';
import { COLORS, SCENES, WIDTH } from '../config';
import { fadeTo } from '../fx/transitions';
import { api, catalog } from '../services';
import { onKey } from '../ui/input';
import { Menu } from '../ui/Menu';
import { isDirection, moveCursor } from '../ui/navigation';
import { TextBox } from '../ui/TextBox';
import { addFrame, addText } from '../ui/widgets';

const COLS = 3;
const CELL_W = 80;
const CELL_H = 48;
const TOP = 15;

/** Escolha do primeiro clonemon, numa grade 3x2. Nome, tipo e atributos aparecem na caixa de texto. */
export class StarterScene extends Phaser.Scene {
  private highlight!: Phaser.GameObjects.Graphics;
  private typeIcon!: Phaser.GameObjects.Image;
  private textBox!: TextBox;
  private index = 0;
  private browsing = false;

  constructor() {
    super(SCENES.starter);
  }

  create(): void {
    this.index = 0;
    addMenuBackground(this);
    addFrame(this, 30, 0, WIDTH - 60, 15);
    addText(this, WIDTH / 2, 4, 'ESCOLHA SEU CLONEMON!').setOrigin(0.5, 0);

    const species = catalog.starters();
    this.highlight = this.add.graphics();
    species.forEach((s, i) => {
      const { x, y } = cell(i);
      const sprite = addMonster(this, x + CELL_W / 2, y + CELL_H / 2, s.id, 'front');
      sprite.setInteractive({ useHandCursor: true }).on('pointerover', () => {
        if (!this.browsing) return;
        if (i !== this.index) audio.sfx('cursor');
        this.index = i;
        this.show(species);
      });
    });
    this.textBox = new TextBox(this);
    this.typeIcon = this.add.image(0, 0, elementKey(species[0].element)).setOrigin(0);
    void this.pick(species);
  }

  private async pick(species: Species[]): Promise<void> {
    for (;;) {
      const chosen = await this.browse(species);
      const s = species[chosen];
      this.typeIcon.setVisible(false);
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
        fadeTo(this, SCENES.hub);
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
        audio.sfx('confirm');
        resolve(this.index);
      };
      this.input.on('gameobjectdown', done);
      const off = onKey(this, (k) => {
        if (k === 'confirm') {
          done();
        } else if (isDirection(k)) {
          const next = moveCursor(this.index, k, species.length, COLS);
          if (next !== this.index) audio.sfx('cursor');
          this.index = next;
          this.show(species);
        }
      });
    });
  }

  private show(species: Species[]): void {
    const { x, y } = cell(this.index);
    this.highlight.clear();
    this.highlight.lineStyle(2, COLORS.accent);
    this.highlight.strokeRect(x + 14, y + 1, CELL_W - 28, CELL_H - 2);
    const s = species[this.index];
    const name = s.name.toUpperCase();
    this.textBox.setText(`${name}     ${s.element}\nATK ${s.baseAtk}  DEF ${s.baseDef}  VEL ${s.baseSpd}`);
    // Icone do tipo logo depois do nome (8px por caractere + 1 espaco).
    this.typeIcon.setTexture(elementKey(s.element)).setPosition(8 + (name.length + 1) * 8, 118).setVisible(true);
  }
}

function cell(i: number): { x: number; y: number } {
  return { x: (i % COLS) * CELL_W, y: TOP + Math.floor(i / COLS) * CELL_H };
}
