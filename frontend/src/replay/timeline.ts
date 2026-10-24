import type { Battle, Combatant, Replay, ReplayMonster } from '../api/types';
import type { HistoryEntry } from '../battle/history';

function combatant(m: ReplayMonster): Combatant {
  return { monsterId: null, ...m, fainted: m.currentHp <= 0, moves: null };
}

/**
 * Estado da tela depois de `k` turnos (0 = inicio), no formato de uma batalha ao vivo, para a mesma arena
 * (BattleStage), os mesmos efeitos e os mesmos sons tocarem o replay.
 */
export function battleAfter(replay: Replay, k: number): Battle {
  const turns = Math.max(0, Math.min(k, replay.turns.length));
  const s = replay.snapshot;
  const player = s.playerTeam.map((m) => ({ ...m }));
  const enemy = s.enemyTeam.map((m) => ({ ...m }));
  let playerActive = s.playerActive;
  let enemyActive = s.enemyActive;

  for (const turn of replay.turns.slice(0, turns)) {
    for (const e of turn.events) {
      playerActive = e.playerActive;
      enemyActive = e.enemyActive ?? enemyActive;
      Object.assign(player[playerActive], { currentHp: e.playerHp, status: e.playerStatus });
      Object.assign(enemy[enemyActive], { currentHp: e.enemyHp, status: e.enemyStatus });
    }
    turn.playerTeam.forEach((g, i) => Object.assign(player[i], g));
  }

  const team = player.map(combatant);
  return {
    id: replay.id,
    status: turns === replay.turns.length ? replay.result : 'AWAITING_ACTION',
    playerActive,
    playerTeam: team,
    enemy: combatant(enemy[enemyActive]),
    log: [],
    npcId: s.npcName ? s.npcName.toLowerCase() : null,
    npcName: s.npcName,
    enemyTeamSize: enemy.length,
    enemyActive,
  };
}

/** Falas dos turnos ja mostrados, para o painel de historico. */
export function replayHistory(replay: Replay, k: number): HistoryEntry[] {
  return replay.turns.slice(0, Math.max(0, k)).flatMap((t, i) => t.events.map((e) => ({ turn: i + 1, text: e.text })));
}

/** Texto da caixa depois de um salto: o oponente no inicio, a ultima fala do turno depois dele. */
export function captionAt(replay: Replay, k: number): string {
  if (k <= 0) return `REPLAY: ${replay.opponent}`;
  return replay.turns[Math.min(k, replay.turns.length) - 1].events.at(-1)?.text ?? '';
}
