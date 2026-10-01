import Phaser from 'phaser';
import { ApiError } from '../api/client';
import type { Roster } from '../api/types';
import { COLORS, SCENES } from '../config';
import { api } from '../services';
import { Menu } from '../ui/Menu';
import { MonsterRows } from '../ui/MonsterRows';
import { TextBox } from '../ui/TextBox';
import { addFrame, addText } from '../ui/widgets';

interface HubData {
  roster?: Roster;
}

const MENU = ['LUTAR', 'TIME', 'CURAR', 'SAIR'] as const;

/** Menu principal: time atual e acoes (batalhar, organizar, curar, sair). */
export class HubScene extends Phaser.Scene {
  /** Exposto para os testes E2E conferirem o que esta na tela. */
  roster: Roster | null = null;
  private rows!: MonsterRows;
  private header!: Phaser.GameObjects.Text;
  private textBox!: TextBox;

  constructor() {
    super(SCENES.hub);
  }

  create(data: HubData): void {
    this.roster = null;
    this.cameras.main.setBackgroundColor(COLORS.sky);
    addFrame(this, 0, 0, 164, 112);
    this.header = addText(this, 8, 6, '');
    this.rows = new MonsterRows(this, 6, 20, 152);
    addFrame(this, 166, 0, 74, 60);
    this.textBox = new TextBox(this);
    void this.run(data.roster);
  }

  private async run(initial?: Roster): Promise<void> {
    try {
      this.show(initial ?? (await api.roster()));
    } catch {
      await this.textBox.sayAndWait('Erro ao carregar o time.');
      this.scene.restart();
      return;
    }

    let cursor = 0;
    for (;;) {
      this.textBox.setText(`O que vamos fazer, ${(api.username() ?? 'treinador').toUpperCase()}?`);
      const menu = new Menu(this, MENU.map((label) => ({ label })), { x: 172, y: 8, initial: cursor });
      const choice = await menu.choose();
      menu.destroy();
      cursor = choice ?? 0;

      try {
        switch (MENU[cursor]) {
          case 'LUTAR':
            this.scene.start(SCENES.battle, { battle: await api.startBattle() });
            return;
          case 'TIME':
            this.scene.start(SCENES.team, { roster: this.roster });
            return;
          case 'CURAR':
            this.show(await api.heal());
            await this.textBox.sayAndWait('Seus CLONEMONS foram curados no CENTRO CLONEMON!');
            break;
          case 'SAIR':
            api.logout();
            this.scene.start(SCENES.title);
            return;
        }
      } catch (e) {
        const msg = e instanceof ApiError && e.status === 409
          ? 'Seu time nao pode lutar agora. Cure seus CLONEMONS!'
          : 'Erro de conexao. Tente de novo.';
        await this.textBox.sayAndWait(msg);
      }
    }
  }

  private show(roster: Roster): void {
    this.roster = roster;
    const pc = roster.box.length > 0 ? `  PC:${roster.box.length}` : '';
    this.header.setText(`TIME ${roster.team.length}/6${pc}`);
    this.rows.render(roster.team);
  }
}

