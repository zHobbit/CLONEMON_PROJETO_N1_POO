import Phaser from 'phaser';
import { registerArt } from '../art/textures';
import { CSS, HEIGHT, SCENES, WIDTH } from '../config';
import { registerEffectArt } from '../fx/hitEffects';
import { api, catalog } from '../services';
import { addText } from '../ui/widgets';

/** Carrega o catalogo de especies e gera as texturas antes de abrir o titulo. */
export class BootScene extends Phaser.Scene {
  private status!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENES.boot);
  }

  create(): void {
    this.status = addText(this, WIDTH / 2, HEIGHT / 2, 'CARREGANDO...', { color: CSS.paper, align: 'center' }).setOrigin(0.5);
    void this.start();
  }

  private async start(): Promise<void> {
    let species;
    try {
      species = await api.species();
    } catch {
      this.status.setText('SERVIDOR OFFLINE\nTENTANDO DE NOVO...');
      this.time.delayedCall(3000, () => void this.start());
      return;
    }
    catalog.set(species);
    registerArt(this, species);
    registerEffectArt(this);
    this.scene.start(SCENES.title);
  }
}
