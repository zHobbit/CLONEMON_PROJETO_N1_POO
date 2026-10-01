import Phaser from 'phaser';
import { monsterTexture } from '../art/placeholder';
import { COLORS, CSS, HEIGHT, SCENES, WIDTH } from '../config';
import { api, catalog } from '../services';
import { waitConfirm } from '../ui/input';
import { addText } from '../ui/widgets';
import { routeHome } from './route';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SCENES.title);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.page);
    addText(this, WIDTH / 2 + 2, 42, 'CLONEMON', { fontSize: '24px', color: CSS.ink }).setOrigin(0.5);
    addText(this, WIDTH / 2, 40, 'CLONEMON', { fontSize: '24px', color: CSS.accent }).setOrigin(0.5);
    addText(this, WIDTH / 2, 64, 'O MELHOR PIOR CLONE', { color: CSS.paper }).setOrigin(0.5);

    const species = catalog.all();
    species.forEach((s, i) => {
      const x = WIDTH / 2 + (i - (species.length - 1) / 2) * 36;
      const sprite = this.add.image(x, 100, monsterTexture(s.id, 'front')).setScale(0.75);
      this.tweens.add({ targets: sprite, y: 96, duration: 400, delay: i * 120, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    });

    const prompt = addText(this, WIDTH / 2, HEIGHT - 20, 'PRESSIONE ENTER', { color: CSS.paper }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0, duration: 500, yoyo: true, repeat: -1 });
    void this.waitStart(prompt);
  }

  private async waitStart(prompt: Phaser.GameObjects.Text): Promise<void> {
    await waitConfirm(this);
    if (!api.isLoggedIn()) {
      this.scene.start(SCENES.login);
      return;
    }
    try {
      await routeHome(this);
    } catch {
      // 401 ja leva ao login (api.onUnauthorized); outros erros: tentar de novo.
      if (this.scene.isActive()) {
        prompt.setText('ERRO DE CONEXAO');
        void this.waitStart(prompt);
      }
    }
  }
}
