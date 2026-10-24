import Phaser from 'phaser';
import { audio } from '../audio';
import { CSS, HEIGHT, WIDTH } from '../config';
import { type HistoryEntry, historyLines, scrollOffset } from '../battle/history';
import { onKey } from './input';
import { addFrame, addText } from './widgets';

const COLS = 28;
const ROWS = 12;
const LINE_HEIGHT = 10;

/**
 * Painel com tudo o que aconteceu na batalha, agrupado por turno. Abre no fim (turno mais novo);
 * setas rolam, H, Esc ou Enter fecham.
 */
export function showHistory(scene: Phaser.Scene, entries: HistoryEntry[]): Promise<void> {
  const lines = historyLines(entries, COLS);
  const frame = addFrame(scene, 0, 0, WIDTH, HEIGHT).setDepth(100);
  const title = addText(scene, 8, 6, 'HISTORICO   (H FECHA)', { color: CSS.accent }).setDepth(101);
  const body = addText(scene, 8, 20, '', { lineSpacing: LINE_HEIGHT - 8 }).setDepth(101);
  const more = addText(scene, WIDTH - 8, HEIGHT - 12, '', { color: CSS.muted }).setOrigin(1, 0).setDepth(101);
  let offset = scrollOffset(lines.length, ROWS);

  const render = () => {
    body.setText(lines.slice(offset, offset + ROWS).join('\n') || 'Nada aconteceu ainda.');
    const up = offset > 0 ? '^' : ' ';
    const down = offset + ROWS < lines.length ? 'v' : ' ';
    more.setText(`${up}${down}`);
  };
  render();

  return new Promise((resolve) => {
    const off = onKey(scene, (k) => {
      if (k === 'up' || k === 'down' || k === 'left' || k === 'right') {
        const step = k === 'up' ? -1 : k === 'down' ? 1 : k === 'left' ? -ROWS : ROWS;
        const next = scrollOffset(lines.length, ROWS, offset, step);
        if (next !== offset) audio.sfx('cursor');
        offset = next;
        render();
        return;
      }
      off();
      audio.sfx('cancel');
      for (const o of [frame, title, body, more]) o.destroy();
      resolve();
    });
  });
}
