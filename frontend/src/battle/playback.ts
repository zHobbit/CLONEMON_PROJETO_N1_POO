import type { Battle, Effect, StatusCondition, TurnEvent } from '../api/types';

export type Side = 'player' | 'enemy';

/** O que esta na tela: monstro ativo do jogador, HP e status de cada lado. */
export interface ViewState {
  playerActive: number;
  playerHp: number;
  enemyHp: number;
  playerStatus: StatusCondition;
  enemyStatus: StatusCondition;
}

/** Um passo de animacao; a cena executa em ordem, esperando cada um terminar. */
export type Step =
  | { kind: 'text'; text: string }
  | { kind: 'wait' }
  /** Investida de quem ataca, antes do alvo piscar. */
  | { kind: 'attack'; side: Side }
  | { kind: 'flash'; side: Side }
  | { kind: 'hp'; side: Side; to: number }
  | { kind: 'faint'; side: Side }
  | { kind: 'switch'; teamIndex: number; hp: number }
  /** O treinador adversario manda o proximo monstro (o da batalha devolvida no fim do turno). */
  | { kind: 'enemySwitch'; hp: number }
  /** Troca o selo de status da caixa de informacoes. */
  | { kind: 'status'; side: Side; status: StatusCondition }
  /** Atributo subiu ou caiu. */
  | { kind: 'stat'; side: Side; up: boolean };

const HIT: Partial<Record<Effect, Side>> = { PLAYER_HIT: 'player', ENEMY_HIT: 'enemy' };
const FAINT: Partial<Record<Effect, Side>> = { PLAYER_FAINT: 'player', ENEMY_FAINT: 'enemy' };
const STATUS_DAMAGE: Partial<Record<Effect, Side>> = { PLAYER_STATUS_DAMAGE: 'player', ENEMY_STATUS_DAMAGE: 'enemy' };
const STAT: Partial<Record<Effect, { side: Side; up: boolean }>> = {
  PLAYER_STAT_UP: { side: 'player', up: true },
  PLAYER_STAT_DOWN: { side: 'player', up: false },
  ENEMY_STAT_UP: { side: 'enemy', up: true },
  ENEMY_STAT_DOWN: { side: 'enemy', up: false },
};

export function viewOf(battle: Battle): ViewState {
  const active = battle.playerTeam[battle.playerActive];
  return {
    playerActive: battle.playerActive,
    playerHp: active.currentHp,
    enemyHp: battle.enemy.currentHp,
    playerStatus: active.status,
    enemyStatus: battle.enemy.status,
  };
}

/**
 * Transforma os eventos de um turno em passos de animacao. Cada evento traz o estado
 * visivel logo apos ele, entao basta comparar com o estado anterior.
 */
export function planTurn(initial: ViewState, events: TurnEvent[]): Step[] {
  const steps: Step[] = [];
  let state = { ...initial };

  for (const e of events) {
    if (e.effect === 'PLAYER_SWITCH' || e.playerActive !== state.playerActive) {
      steps.push({ kind: 'switch', teamIndex: e.playerActive, hp: e.playerHp });
      // O selo do monstro que entra ja vem do time; so mudancas depois disso viram passo.
      state = { ...state, playerActive: e.playerActive, playerHp: e.playerHp, playerStatus: e.playerStatus };
    }

    if (e.effect === 'ENEMY_SWITCH') {
      steps.push({ kind: 'enemySwitch', hp: e.enemyHp });
      state = { ...state, enemyHp: e.enemyHp, enemyStatus: e.enemyStatus };
    }

    steps.push({ kind: 'text', text: e.text });

    const hit = HIT[e.effect];
    if (hit) {
      steps.push({ kind: 'attack', side: hit === 'enemy' ? 'player' : 'enemy' });
      steps.push({ kind: 'flash', side: hit });
    }
    const burned = STATUS_DAMAGE[e.effect];
    if (burned) steps.push({ kind: 'flash', side: burned });
    const stat = STAT[e.effect];
    if (stat) steps.push({ kind: 'stat', ...stat });

    if (e.enemyHp !== state.enemyHp) steps.push({ kind: 'hp', side: 'enemy', to: e.enemyHp });
    if (e.playerHp !== state.playerHp) steps.push({ kind: 'hp', side: 'player', to: e.playerHp });
    if (e.enemyStatus !== state.enemyStatus) steps.push({ kind: 'status', side: 'enemy', status: e.enemyStatus });
    if (e.playerStatus !== state.playerStatus) steps.push({ kind: 'status', side: 'player', status: e.playerStatus });

    const faint = FAINT[e.effect];
    if (faint) steps.push({ kind: 'faint', side: faint });

    steps.push({ kind: 'wait' });
    state = {
      playerActive: e.playerActive,
      playerHp: e.playerHp,
      enemyHp: e.enemyHp,
      playerStatus: e.playerStatus,
      enemyStatus: e.enemyStatus,
    };
  }
  return steps;
}
