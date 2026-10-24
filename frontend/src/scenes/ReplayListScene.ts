import Phaser from 'phaser';
import type { ReplaySummary } from '../api/types';
import { addMenuBackground } from '../art/textures';
import { audio } from '../audio';
import { CSS, HEIGHT, SCENES, WIDTH } from '../config';
import { fadeTo } from '../fx/transitions';
import { listLabel, listStart } from '../replay/controls';
import { api } from '../services';
import { onKey, waitConfirm } from '../ui/input';
import { addFrame, addText } from '../ui/widgets';

const ROWS = 12;
const ROW_HEIGHT = 10;

/** Lista dos replays (ate 20): setas escolhem, Enter abre, Esc volta ao mapa. */
export class ReplayListScene extends Phaser.Scene {
  /** Exposto para os testes E2E. */
  summaries: ReplaySummary[] | null = null;

  constructor() {
    super(SCENES.replays);
  }

  create(): void {
    this.summaries = null;
    addMenuBackground(this);
    addFrame(this, 0, 0, WIDTH, HEIGHT);
    addText(this, 8, 6, 'REPLAYS   (ESC VOLTA)', { color: CSS.accent });
    void this.fetchList(addText(this, 8, 24, 'CARREGANDO...'));
  }

  private async fetchList(status: Phaser.GameObjects.Text): Promise<void> {
    let list: ReplaySummary[];
    try {
      list = await api.replays();
    } catch {
      if (!this.scene.isActive()) return; // 401: ja fomos para o login
      status.setText('ERRO DE CONEXAO');
      await waitConfirm(this);
      fadeTo(this, SCENES.world);
      return;
    }
    this.summaries = list;
    if (list.length === 0) {
      status.setText('NENHUM REPLAY AINDA');
      await waitConfirm(this);
      fadeTo(this, SCENES.world);
      return;
    }
    status.destroy();
    this.choose(list);
  }

  private choose(list: ReplaySummary[]): void {
    const rows = addText(this, 12, 22, '', { lineSpacing: ROW_HEIGHT - 8 });
    const cursor = addText(this, 3, 22, '>');
    let index = 0;
    let start = 0;
    const render = () => {
      start = listStart(index, list.length, ROWS, start);
      rows.setText(list.slice(start, start + ROWS).map(listLabel).join('\n'));
      cursor.setY(22 + (index - start) * ROW_HEIGHT);
    };
    render();
    const off = onKey(this, (k) => {
      if (k === 'up' || k === 'down') {
        const next = Math.max(0, Math.min(list.length - 1, index + (k === 'up' ? -1 : 1)));
        if (next !== index) audio.sfx('cursor');
        index = next;
        render();
      } else if (k === 'confirm') {
        off();
        audio.sfx('confirm');
        fadeTo(this, SCENES.replay, { id: list[index].id });
      } else if (k === 'cancel') {
        off();
        audio.sfx('cancel');
        fadeTo(this, SCENES.world);
      }
    });
  }
}
