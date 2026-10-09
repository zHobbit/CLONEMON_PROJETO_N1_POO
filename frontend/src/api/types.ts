/** Espelha os DTOs da API em backend/src/main/java/br/clonemon/web/dto. */

export type Element = 'AGUA' | 'ROCHA' | 'FOGO' | 'GELO' | 'GRAMA' | 'RAIO';

export interface Move {
  name: string;
  element: Element;
  power: number;
  accuracy: number;
  maxPp: number;
  /** Nulo no catalogo de especies. */
  ppLeft: number | null;
}

export interface Species {
  id: number;
  name: string;
  element: Element;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpd: number;
  moves: Move[];
}

export interface Monster {
  id: number;
  speciesId: number;
  species: string;
  nickname: string;
  element: Element;
  level: number;
  xp: number;
  xpNextLevel: number;
  currentHp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  /** Nulo quando o monstro esta no PC. */
  teamSlot: number | null;
  moves: Move[];
}

export interface Roster {
  team: Monster[];
  box: Monster[];
}

export type BattleStatus = 'AWAITING_ACTION' | 'PLAYER_WON' | 'PLAYER_LOST' | 'FLED';

export interface Combatant {
  monsterId: number | null;
  speciesId: number;
  name: string;
  element: Element;
  level: number;
  currentHp: number;
  maxHp: number;
  fainted: boolean;
  /** Nulo para o oponente. */
  moves: Move[] | null;
}

export interface Battle {
  id: number;
  status: BattleStatus;
  playerActive: number;
  playerTeam: Combatant[];
  enemy: Combatant;
  log: string[];
}

export type Effect =
  | 'NONE'
  | 'PLAYER_HIT'
  | 'ENEMY_HIT'
  | 'PLAYER_FAINT'
  | 'ENEMY_FAINT'
  | 'PLAYER_SWITCH'
  | 'ENEMY_SWITCH'
  | 'WON'
  | 'LOST'
  | 'FLED';

export interface TurnEvent {
  text: string;
  effect: Effect;
  playerActive: number;
  playerHp: number;
  enemyHp: number;
}

export interface TurnResponse {
  events: TurnEvent[];
  battle: Battle;
}

export type TurnAction =
  | { action: 'MOVE'; moveIndex: number }
  | { action: 'SWITCH'; teamIndex: number }
  | { action: 'RUN' };

export interface TokenResponse {
  token: string;
  username: string;
  expiresAt: string;
}
