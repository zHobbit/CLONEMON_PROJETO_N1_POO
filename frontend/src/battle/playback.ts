import type { Battle, Effect, TurnEvent } from '../api/types';

export type Side = 'player' | 'enemy';

/** O que esta na tela: monstro ativo do jogador e HP de cada lado. */
export interface ViewState {
  playerActive: number;
  playerHp: number;
  enemyHp: number;
}

/** Um passo de animacao; a cena executa em ordem, esperando cada um terminar. */
export type Step =
  | { kind: 'text'; text: string }
  | { kind: 'wait' }
  | { kind: 'flash'; side: Side }
  | { kind: 'hp'; side: Side; to: number }
  | { kind: 'faint'; side: Side }
  | { kind: 'switch'; teamIndex: number; hp: number };

const HIT: Partial<Record<Effect, Side>> = { PLAYER_HIT: 'player', ENEMY_HIT: 'enemy' };
const FAINT: Partial<Record<Effect, Side>> = { PLAYER_FAINT: 'player', ENEMY_FAINT: 'enemy' };

export function viewOf(battle: Battle): ViewState {
  return {
    playerActive: battle.playerActive,
    playerHp: battle.playerTeam[battle.playerActive].currentHp,
    enemyHp: battle.enemy.currentHp,
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
      state = { ...state, playerActive: e.playerActive, playerHp: e.playerHp };
    }

    steps.push({ kind: 'text', text: e.text });

    const hit = HIT[e.effect];
    if (hit) steps.push({ kind: 'flash', side: hit });
    if (e.enemyHp !== state.enemyHp) steps.push({ kind: 'hp', side: 'enemy', to: e.enemyHp });
    if (e.playerHp !== state.playerHp) steps.push({ kind: 'hp', side: 'player', to: e.playerHp });

    const faint = FAINT[e.effect];
    if (faint) steps.push({ kind: 'faint', side: faint });

    steps.push({ kind: 'wait' });
    state = { playerActive: e.playerActive, playerHp: e.playerHp, enemyHp: e.enemyHp };
  }
  return steps;
}
