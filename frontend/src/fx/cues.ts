import type { Battle, Element, TurnEvent } from '../api/types';
import type { Side } from '../battle/playback';

/** Golpe que tira 30% ou mais do HP maximo: a tela treme e o som e o forte. */
export const HEAVY_HIT = 0.3;

/** Ciclo de tipos (o mesmo do backend): cada um causa dano dobrado no seguinte. */
const CYCLE: readonly Element[] = ['AGUA', 'ROCHA', 'FOGO', 'GELO', 'GRAMA', 'RAIO'];

export function beats(attacker: Element, defender: Element): boolean {
  return CYCLE[(CYCLE.indexOf(attacker) + 1) % CYCLE.length] === defender;
}

export interface HitCue {
  /** Quem foi atingido. */
  target: Side;
  /** Elemento de quem atacou: escolhe o efeito desenhado sobre o alvo. */
  element: Element;
  /** Tirou HEAVY_HIT ou mais do HP maximo do alvo. */
  heavy: boolean;
  /** Pesado ou com vantagem de tipo: som de golpe forte. */
  strong: boolean;
}

export interface TurnCues {
  /** Na ordem dos eventos do turno. */
  hits: HitCue[];
  outcome: 'victory' | 'defeat' | null;
  /** Algum monstro do jogador subiu de nivel neste turno. */
  levelUp: boolean;
}

export const NO_CUES: TurnCues = { hits: [], outcome: null, levelUp: false };

/**
 * Le os efeitos de um turno so com dados estruturados (eventos e estado da batalha), sem
 * interpretar texto: quem atacou quem, com que elemento, quanto dano e como a batalha acabou.
 */
export function turnCues(before: Battle, after: Battle, events: readonly TurnEvent[]): TurnCues {
  const hits: HitCue[] = [];
  let enemy = before.enemy;
  let active = before.playerActive;
  let playerHp = before.playerTeam[active]?.currentHp ?? 0;
  let enemyHp = before.enemy.currentHp;

  for (const e of events) {
    if (e.effect === 'ENEMY_SWITCH') enemy = after.enemy;
    if (e.effect === 'PLAYER_SWITCH' || e.playerActive !== active) {
      active = e.playerActive;
      playerHp = e.playerHp;
    }
    const target: Side | null = e.effect === 'ENEMY_HIT' ? 'enemy' : e.effect === 'PLAYER_HIT' ? 'player' : null;
    const player = before.playerTeam[active] ?? after.playerTeam[active];
    if (target && player) {
      const [attacker, defender] = target === 'enemy' ? [player, enemy] : [enemy, player];
      const damage = target === 'enemy' ? enemyHp - e.enemyHp : playerHp - e.playerHp;
      const heavy = defender.maxHp > 0 && damage >= HEAVY_HIT * defender.maxHp;
      hits.push({ target, element: attacker.element, heavy, strong: heavy || beats(attacker.element, defender.element) });
    }
    playerHp = e.playerHp;
    enemyHp = e.enemyHp;
  }

  const outcome = after.status === 'PLAYER_WON' ? 'victory' : after.status === 'PLAYER_LOST' ? 'defeat' : null;
  const levelUp = after.playerTeam.some((m, i) => before.playerTeam[i] !== undefined && m.level > before.playerTeam[i].level);
  return { hits, outcome, levelUp };
}
