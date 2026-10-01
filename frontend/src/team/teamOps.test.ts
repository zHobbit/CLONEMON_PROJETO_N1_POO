import { describe, expect, it } from 'vitest';
import type { Monster, Roster } from '../api/types';
import { allMonsters, applyAction, availableActions } from './teamOps';

function monster(id: number, teamSlot: number | null): Monster {
  return {
    id, speciesId: 1, species: 'Lindoya', nickname: 'Lindoya', element: 'AGUA', level: 5, xp: 125, xpNextLevel: 216,
    currentHp: 20, maxHp: 20, attack: 9, defense: 11, speed: 9, teamSlot, moves: [],
  };
}

function roster(team: number[], box: number[] = []): Roster {
  return { team: team.map((id, i) => monster(id, i)), box: box.map((id) => monster(id, null)) };
}

describe('availableActions', () => {
  it('a lone team member cannot leave the team or move up', () => {
    expect(availableActions(roster([1]), 1)).toEqual([]);
  });

  it('team members can move up (unless first) and go to the PC', () => {
    const r = roster([1, 2]);
    expect(availableActions(r, 1)).toEqual(['toBox']);
    expect(availableActions(r, 2)).toEqual(['up', 'toBox']);
  });

  it('boxed monsters can join only when the team has room', () => {
    expect(availableActions(roster([1], [9]), 9)).toEqual(['toTeam']);
    expect(availableActions(roster([1, 2, 3, 4, 5, 6], [9]), 9)).toEqual([]);
  });
});

describe('applyAction', () => {
  it('moves a monster one slot up', () => {
    expect(applyAction([1, 2, 3], 3, 'up')).toEqual([1, 3, 2]);
    expect(applyAction([1, 2, 3], 1, 'up')).toEqual([1, 2, 3]);
  });

  it('sends to the PC but never empties the team', () => {
    expect(applyAction([1, 2], 1, 'toBox')).toEqual([2]);
    expect(applyAction([1], 1, 'toBox')).toEqual([1]);
  });

  it('adds to the end of the team up to six', () => {
    expect(applyAction([1, 2], 9, 'toTeam')).toEqual([1, 2, 9]);
    expect(applyAction([1, 2, 3, 4, 5, 6], 9, 'toTeam')).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('allMonsters', () => {
  it('lists the team first, then the PC', () => {
    expect(allMonsters(roster([2, 1], [7])).map((m) => m.id)).toEqual([2, 1, 7]);
  });
});
