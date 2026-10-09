import Phaser from 'phaser';
import { BG, addMonster } from '../art/textures';
import { CSS, HEIGHT, SCENES, WIDTH } from '../config';
import { api, catalog } from '../services';
import { waitConfirm } from '../ui/input';
import { addText } from '../ui/widgets';
import { routeHome } from './route';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SCENES.title);
  }

  create(): void {
    this.add.image(0, 0, BG.title).setOrigin(0);
    addText(this, WIDTH / 2 + 2, 32, 'CLONEMON', { fontSize: '24px', color: CSS.ink }).setOrigin(0.5);
    addText(this, WIDTH / 2, 30, 'CLONEMON', { fontSize: '24px', color: CSS.accent }).setOrigin(0.5);
    addText(this, WIDTH / 2, 54, 'O MELHOR PIOR CLONE', { color: CSS.paper }).setOrigin(0.5);

    // Em zigue-zague para os sprites de 48px caberem lado a lado.
    const species = catalog.starters();
    species.forEach((s, i) => {
      const x = WIDTH / 2 + (i - (species.length - 1) / 2) * 38;
      addMonster(this, x, i % 2 === 0 ? 98 : 110, s.id, 'front');
    });

    const prompt = addText(this, WIDTH / 2, HEIGHT - 12, 'PRESSIONE ENTER', { color: CSS.paper }).setOrigin(0.5);
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
