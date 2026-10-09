import type { Monster, Roster } from '../api/types';

export const TEAM_SIZE = 6;

/** Time primeiro (na ordem dos slots), depois o PC. */
export function allMonsters(roster: Roster): Monster[] {
  return [...roster.team, ...roster.box];
}

export function teamIds(roster: Roster): number[] {
  return roster.team.map((m) => m.id);
}

export type TeamAction = 'up' | 'toBox' | 'toTeam';

/** Acoes possiveis para um monstro, conforme onde ele esta e o tamanho do time. */
export function availableActions(roster: Roster, monsterId: number): TeamAction[] {
  const ids = teamIds(roster);
  const index = ids.indexOf(monsterId);
  if (index < 0) return ids.length < TEAM_SIZE ? ['toTeam'] : [];
  const actions: TeamAction[] = [];
  if (index > 0) actions.push('up');
  if (ids.length > 1) actions.push('toBox');
  return actions;
}

/** Nova ordem do time depois da acao (o que a API espera em PUT /api/team). */
export function applyAction(ids: number[], monsterId: number, action: TeamAction): number[] {
  const index = ids.indexOf(monsterId);
  switch (action) {
    case 'up': {
      if (index <= 0) return ids;
      const next = [...ids];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    }
    case 'toBox':
      return index < 0 || ids.length <= 1 ? ids : ids.filter((id) => id !== monsterId);
    case 'toTeam':
      return index >= 0 || ids.length >= TEAM_SIZE ? ids : [...ids, monsterId];
  }
}
