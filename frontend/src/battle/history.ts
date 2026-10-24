/** Uma linha de texto da batalha e o turno em que aconteceu (0 = antes desta tela, ao retomar). */
export interface HistoryEntry {
  turn: number;
  text: string;
}

/** Quebra o texto em linhas de ate `cols` colunas, por palavra, com um espaco de recuo. */
function wrap(text: string, cols: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && next.length + 1 > cols) {
      lines.push(` ${line}`);
      line = word;
    } else line = next;
  }
  if (line) lines.push(` ${line}`);
  return lines;
}

/** Linhas do painel de historico: um cabecalho por turno ("ANTES" para o turno 0) e os textos recuados. */
export function historyLines(entries: HistoryEntry[], cols: number): string[] {
  const lines: string[] = [];
  let turn = -1;
  for (const e of entries) {
    if (e.turn !== turn) {
      turn = e.turn;
      lines.push(turn === 0 ? 'ANTES' : `TURNO ${turn}`);
    }
    lines.push(...wrap(e.text, cols));
  }
  return lines;
}

/**
 * Primeira linha visivel numa janela de `rows` linhas. Sem `current`, mostra o fim (o turno mais novo);
 * com `step`, rola a partir de `current` sem sair da lista.
 */
export function scrollOffset(total: number, rows: number, current?: number, step = 0): number {
  const max = Math.max(0, total - rows);
  return Math.min(max, Math.max(0, (current ?? max) + step));
}
