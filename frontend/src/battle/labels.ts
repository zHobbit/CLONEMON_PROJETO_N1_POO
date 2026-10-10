import type { Move, Stat, StatusCondition } from '../api/types';

/** Selo de 3 letras mostrado na caixa de informacoes; vazio sem status. */
export const STATUS_BADGE: Record<StatusCondition, string> = {
  NONE: '',
  BURN: 'QUE',
  FREEZE: 'CON',
  PARALYSIS: 'PAR',
  SLEEP: 'DOR',
};

const STAT_LABEL: Record<Stat, string> = { ATK: 'ATK', DEF: 'DEF', SPD: 'VEL' };

/**
 * Efeito do golpe em poucas letras: "QUE 30%", "DOR", "ATK+2" (sobe o proprio atributo),
 * "VEL-1 30%" (baixa o atributo do alvo). Vazio se o golpe nao tiver efeito.
 */
export function effectLabel(move: Move): string {
  const chance = move.effectChance < 100 ? ` ${move.effectChance}%` : '';
  switch (move.effect) {
    case 'NONE':
      return '';
    case 'RAISE':
    case 'LOWER': {
      const sign = move.effect === 'RAISE' ? '+' : '-';
      return `${STAT_LABEL[move.effectStat ?? 'ATK']}${sign}${move.effectStages}${chance}`;
    }
    default:
      return `${STATUS_BADGE[move.effect]}${chance}`;
  }
}

/** Linha do menu de golpes: nome em 19 colunas e o PP. */
export function moveRow(move: Move): string {
  return `${move.name.toUpperCase().padEnd(19)} ${String(move.ppLeft ?? 0).padStart(2)}/${String(move.maxPp).padStart(2)}`;
}

/** Detalhes do golpe selecionado (cabe em 26 colunas, ao lado do icone do tipo). */
export function moveInfo(move: Move): string {
  const power = move.power > 0 ? String(move.power) : '--';
  return [`POD ${power}`, `PRE ${move.accuracy}`, effectLabel(move)].filter(Boolean).join(' ');
}
