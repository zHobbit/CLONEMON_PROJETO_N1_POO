import Phaser from 'phaser';
import type { Monster, Roster } from '../api/types';
import { addMenuBackground } from '../art/textures';
import { audio } from '../audio';
import { SCENES } from '../config';
import { fadeTo } from '../fx/transitions';
import { api } from '../services';
import { type TeamAction, allMonsters, applyAction, availableActions, teamIds } from '../team/teamOps';
import { onKey } from '../ui/input';
import { Menu } from '../ui/Menu';
import { MonsterRows } from '../ui/MonsterRows';
import { TextBox } from '../ui/TextBox';
import { addFrame, addText } from '../ui/widgets';

interface TeamData {
  roster?: Roster | null;
}

const VISIBLE = 6;
const LABELS: Record<TeamAction, string> = { up: 'SUBIR', toBox: 'P/ PC', toTeam: 'P/ TIME' };

/** Organizar o time: ordem dos slots e troca entre time e PC. */
export class TeamScene extends Phaser.Scene {
  private roster!: Roster;
  private rows!: MonsterRows;
  private textBox!: TextBox;
  private index = 0;
  private offset = 0;

  constructor() {
    super(SCENES.team);
  }

  create(data: TeamData): void {
    this.index = 0;
    this.offset = 0;
    addMenuBackground(this);
    addFrame(this, 0, 0, 164, 112);
    addText(this, 8, 6, 'TIME E PC   ESC: VOLTAR');
    this.rows = new MonsterRows(this, 6, 20, 152);
    this.textBox = new TextBox(this);
    void this.run(data.roster ?? null);
  }

  private async run(initial: Roster | null): Promise<void> {
    this.roster = initial ?? (await api.roster());
    for (;;) {
      const monster = await this.browse();
      if (!monster) {
        fadeTo(this, SCENES.world, { roster: this.roster });
        return;
      }
      const actions = availableActions(this.roster, monster.id);
      if (actions.length === 0) {
        await this.textBox.sayAndWait('O time precisa de pelo menos 1 e no maximo 6 CLONEMONS.');
        continue;
      }

      const frame = addFrame(this, 166, 0, 74, 16 + 12 * (actions.length + 1));
      const menu = new Menu(this, [...actions.map((a) => ({ label: LABELS[a] })), { label: 'VOLTAR' }], {
        x: 172,
        y: 8,
        cancellable: true,
      });
      const choice = await menu.choose();
      menu.destroy();
      frame.destroy();
      if (choice === null || choice >= actions.length) continue;

      try {
        const ids = applyAction(teamIds(this.roster), monster.id, actions[choice]);
        this.roster = await api.updateTeam(ids);
        this.index = allMonsters(this.roster).findIndex((m) => m.id === monster.id);
      } catch {
        await this.textBox.sayAndWait('Nao foi possivel mudar o time.');
      }
    }
  }

  /** Navega pela lista; devolve o monstro escolhido ou null ao sair. */
  private browse(): Promise<Monster | null> {
    const monsters = allMonsters(this.roster);
    this.render(monsters);
    return new Promise((resolve) => {
      const off = onKey(this, (k) => {
        if (k === 'confirm') {
          off();
          audio.sfx('confirm');
          resolve(monsters[this.index]);
        } else if (k === 'cancel') {
          off();
          audio.sfx('cancel');
          resolve(null);
        } else if (k === 'up' || k === 'down') {
          const next = Phaser.Math.Clamp(this.index + (k === 'up' ? -1 : 1), 0, monsters.length - 1);
          if (next !== this.index) audio.sfx('cursor');
          this.index = next;
          this.render(monsters);
        }
      });
    });
  }

  private render(monsters: Monster[]): void {
    if (this.index < this.offset) this.offset = this.index;
    if (this.index >= this.offset + VISIBLE) this.offset = this.index - VISIBLE + 1;
    this.rows.render(monsters.slice(this.offset, this.offset + VISIBLE), {
      selected: this.index - this.offset,
      tag: (m) => (m.teamSlot === null ? 'PC ' : ''),
    });
    const m = monsters[this.index];
    this.textBox.setText(
      `${m.nickname.toUpperCase()}  TIPO ${m.element}\nATK ${m.attack} DEF ${m.defense} VEL ${m.speed}\nXP ${m.xp}/${m.xpNextLevel}`,
    );
  }
}
