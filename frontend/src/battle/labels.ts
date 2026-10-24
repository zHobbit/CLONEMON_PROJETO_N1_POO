import type { Element, Move, Stat, StatusCondition } from '../api/types';
import { effectiveness } from './elements';

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

/** Colunas da linha de detalhes, ao lado do icone do tipo. */
export const INFO_COLUMNS = 26;

export type Matchup = 'super' | 'weak' | 'neutral';

const MATCHUP_TAG: Record<Matchup, string> = { super: 'SUPER!', weak: 'FRACO', neutral: '' };

/** Golpe de dano contra o elemento do oponente atual; golpe de status e sempre neutro. */
export function matchup(move: Move, defender: Element): Matchup {
  if (move.power <= 0) return 'neutral';
  const eff = effectiveness(move.element, defender);
  return eff > 1 ? 'super' : eff < 1 ? 'weak' : 'neutral';
}

/**
 * Detalhes do golpe selecionado. Com o elemento do oponente, acrescenta "SUPER!" ou "FRACO"
 * se couber nas {@link INFO_COLUMNS} colunas (a seta na linha do golpe mostra sempre).
 */
export function moveInfo(move: Move, defender?: Element): string {
  const power = move.power > 0 ? String(move.power) : '--';
  const info = [`POD ${power}`, `PRE ${move.accuracy}`, effectLabel(move)].filter(Boolean).join(' ');
  const tag = defender ? MATCHUP_TAG[matchup(move, defender)] : '';
  return tag && info.length + 1 + tag.length <= INFO_COLUMNS ? `${info} ${tag}` : info;
}
