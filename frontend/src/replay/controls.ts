import type { ReplayResult, ReplaySummary } from '../api/types';

/** Velocidades do replay, trocadas com as setas para cima e para baixo. */
export const SPEEDS = [1, 2, 4] as const;

export function nextSpeed(index: number, dir: 1 | -1): number {
  return Math.max(0, Math.min(SPEEDS.length - 1, index + dir));
}

/** Rodape do replay: "TURNO 3/12 2x >" (tocando) ou "... ||" (pausado). */
export function footerLabel(turn: number, total: number, speedIndex: number, playing: boolean): string {
  return `TURNO ${turn}/${total} ${SPEEDS[speedIndex]}x ${playing ? '>' : '||'}`;
}

const RESULT: Record<ReplayResult, string> = { PLAYER_WON: 'VENCEU', PLAYER_LOST: 'PERDEU', FLED: 'FUGIU' };

/** Linha da lista em 28 colunas: oponente (11), resultado (6), turnos (3) e data local (dd/mm). */
export function listLabel(s: ReplaySummary): string {
  const opponent = s.opponent.replace(/ selvagem$/, '').toUpperCase().slice(0, 11).padEnd(11);
  const date = new Date(s.finishedAt);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${opponent} ${RESULT[s.result].padEnd(6)} ${`${s.turnCount}T`.padStart(3)} ${dd}/${mm}`;
}

/** Primeira linha visivel de uma lista com `rows` linhas, mantendo o cursor a vista. */
export function listStart(cursor: number, total: number, rows: number, start: number): number {
  const max = Math.max(0, total - rows);
  if (cursor < start) return cursor;
  if (cursor >= start + rows) return Math.min(max, cursor - rows + 1);
  return Math.min(start, max);
}
