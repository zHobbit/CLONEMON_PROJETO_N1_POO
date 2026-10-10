/** Espelha os DTOs da API em backend/src/main/java/br/clonemon/web/dto. */

export type Element = 'AGUA' | 'ROCHA' | 'FOGO' | 'GELO' | 'GRAMA' | 'RAIO';

/** Status de batalha; some quando a batalha termina. */
export type StatusCondition = 'NONE' | 'BURN' | 'FREEZE' | 'PARALYSIS' | 'SLEEP';

export type Stat = 'ATK' | 'DEF' | 'SPD';

/** Status aplicado no alvo, RAISE (sobe atributo de quem usa) ou LOWER (baixa atributo do alvo). */
export type MoveEffect = 'NONE' | 'BURN' | 'FREEZE' | 'PARALYSIS' | 'SLEEP' | 'RAISE' | 'LOWER';

export interface Move {
  name: string;
  element: Element;
  /** 0 = golpe de status. */
  power: number;
  accuracy: number;
  maxPp: number;
  /** Nulo no catalogo de especies. */
  ppLeft: number | null;
  /** Nivel em que a especie aprende o golpe. */
  learnLevel: number;
  effect: MoveEffect;
  /** Chance do efeito, em %, quando o golpe acerta. */
  effectChance: number;
  /** So para RAISE e LOWER. */
  effectStat: Stat | null;
  effectStages: number;
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
  status: StatusCondition;
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
  /** Treinador adversario (ex.: "caio"); nulo em batalha selvagem. */
  npcId: string | null;
  npcName: string | null;
  /** Tamanho do time do oponente (1 na selvagem) e indice do monstro dele em campo. */
  enemyTeamSize: number;
  enemyActive: number;
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
  | 'FLED'
  /** Ganhou um status (o novo status vem em playerStatus/enemyStatus). */
  | 'PLAYER_STATUS'
  | 'ENEMY_STATUS'
  /** Acordou ou descongelou. */
  | 'PLAYER_CURE'
  | 'ENEMY_CURE'
  /** Dano da queimadura no fim do turno. */
  | 'PLAYER_STATUS_DAMAGE'
  | 'ENEMY_STATUS_DAMAGE'
  | 'PLAYER_STAT_UP'
  | 'PLAYER_STAT_DOWN'
  | 'ENEMY_STAT_UP'
  | 'ENEMY_STAT_DOWN'
  | 'MOVE_LEARNED';

export interface TurnEvent {
  text: string;
  effect: Effect;
  playerActive: number;
  playerHp: number;
  enemyHp: number;
  playerStatus: StatusCondition;
  enemyStatus: StatusCondition;
}

export interface TurnResponse {
  events: TurnEvent[];
  battle: Battle;
}

export type TurnAction =
  | { action: 'MOVE'; moveIndex: number }
  | { action: 'SWITCH'; teamIndex: number }
  | { action: 'RUN' };

export type Facing = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface WorldPosition {
  x: number;
  y: number;
  facing: Facing;
}

/** Progresso no mapa: posicao salva (nula = ponto de partida do mapa) e treinadores ja vencidos. */
export interface WorldState {
  position: WorldPosition | null;
  defeatedNpcs: string[];
}

export interface TokenResponse {
  token: string;
  username: string;
  expiresAt: string;
}
