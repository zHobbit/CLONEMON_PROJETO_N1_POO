import type { Effect, TurnEvent } from '../api/types';

/** Troca ou desmaio: a batalha mudou, volta a velocidade normal para o jogador acompanhar. */
const RESET: ReadonlySet<Effect> = new Set<Effect>(['PLAYER_SWITCH', 'ENEMY_SWITCH', 'PLAYER_FAINT', 'ENEMY_FAINT']);

/**
 * Acelera batalhas longas: depois de 3 turnos seguidos sem troca nem desmaio, texto e animacoes
 * ficam 1,5x mais rapidos; depois de 6, 2x.
 */
export class Pace {
  private calmTurns = 0;

  get factor(): number {
    if (this.calmTurns >= 6) return 2;
    if (this.calmTurns >= 3) return 1.5;
    return 1;
  }

  afterTurn(events: TurnEvent[]): void {
    this.calmTurns = events.some((e) => RESET.has(e.effect)) ? 0 : this.calmTurns + 1;
  }
}
