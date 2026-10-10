import { describe, expect, it } from 'vitest';
import type { Battle, StatusCondition, TurnEvent } from '../api/types';
import { planTurn, type ViewState, viewOf } from './playback';

const start: ViewState = { playerActive: 0, playerHp: 20, enemyHp: 18, playerStatus: 'NONE', enemyStatus: 'NONE' };

function ev(text: string, partial: Partial<TurnEvent> = {}): TurnEvent {
  return { text, effect: 'NONE', playerActive: 0, playerHp: 20, enemyHp: 18, playerStatus: 'NONE', enemyStatus: 'NONE', ...partial };
}

describe('planTurn', () => {
  it('animates a hit: text, attacker lunge, target flash, hp drop, then waits', () => {
    const steps = planTurn(start, [ev('Lucifer usou Molotov!', { effect: 'ENEMY_HIT', enemyHp: 9 })]);
    expect(steps).toEqual([
      { kind: 'text', text: 'Lucifer usou Molotov!' },
      { kind: 'attack', side: 'player' },
      { kind: 'flash', side: 'enemy' },
      { kind: 'hp', side: 'enemy', to: 9 },
      { kind: 'wait' },
    ]);
  });

  it('a miss only shows text', () => {
    const steps = planTurn(start, [ev('Coiso usou Meteoro!'), ev('Errou!')]);
    expect(steps.map((s) => s.kind)).toEqual(['text', 'wait', 'text', 'wait']);
  });

  it('tracks hp across events so each change animates once', () => {
    const steps = planTurn(start, [
      ev('Lucifer usou Molotov!', { effect: 'ENEMY_HIT', enemyHp: 9 }),
      ev('E super efetivo!', { enemyHp: 9 }),
      ev('Olaf usou Cubo de gelo!', { effect: 'PLAYER_HIT', enemyHp: 9, playerHp: 14 }),
    ]);
    expect(steps.filter((s) => s.kind === 'hp')).toEqual([
      { kind: 'hp', side: 'enemy', to: 9 },
      { kind: 'hp', side: 'player', to: 14 },
    ]);
    expect(steps.filter((s) => s.kind === 'flash')).toEqual([
      { kind: 'flash', side: 'enemy' },
      { kind: 'flash', side: 'player' },
    ]);
    expect(steps.filter((s) => s.kind === 'attack')).toEqual([
      { kind: 'attack', side: 'player' },
      { kind: 'attack', side: 'enemy' },
    ]);
  });

  it('faints after the message', () => {
    const steps = planTurn(start, [ev('Olaf desmaiou!', { effect: 'ENEMY_FAINT', enemyHp: 0 })]);
    expect(steps.map((s) => s.kind)).toEqual(['text', 'hp', 'faint', 'wait']);
    expect(steps[2]).toEqual({ kind: 'faint', side: 'enemy' });
  });

  it('switches before announcing the new monster, without animating its hp', () => {
    const steps = planTurn(start, [ev('Vai, Groot!', { effect: 'PLAYER_SWITCH', playerActive: 1, playerHp: 30 })]);
    expect(steps).toEqual([
      { kind: 'switch', teamIndex: 1, hp: 30 },
      { kind: 'text', text: 'Vai, Groot!' },
      { kind: 'wait' },
    ]);
  });

  it('animates hp changes that have no effect, like a level up', () => {
    const steps = planTurn(start, [ev('Lucifer subiu para o nivel 6!', { playerHp: 22 })]);
    expect(steps).toContainEqual({ kind: 'hp', side: 'player', to: 22 });
  });

  it('returns nothing for no events', () => {
    expect(planTurn(start, [])).toEqual([]);
  });

  it('updates the status badge after the message that applies it', () => {
    const steps = planTurn(start, [
      ev('Lucifer usou Churrasco grego!', { effect: 'ENEMY_HIT', enemyHp: 12 }),
      ev('Coiso pegou fogo!', { effect: 'ENEMY_STATUS', enemyHp: 12, enemyStatus: 'BURN' }),
    ]);
    expect(steps.slice(5)).toEqual([
      { kind: 'text', text: 'Coiso pegou fogo!' },
      { kind: 'status', side: 'enemy', status: 'BURN' },
      { kind: 'wait' },
    ]);
  });

  it('clears the badge when the monster wakes up or thaws', () => {
    const asleep = { ...start, playerStatus: 'SLEEP' as const };
    const steps = planTurn(asleep, [ev('Groot acordou!', { effect: 'PLAYER_CURE' })]);
    expect(steps).toContainEqual({ kind: 'status', side: 'player', status: 'NONE' });
  });

  it('keeps the badge while the status lasts', () => {
    const frozen = { ...start, enemyStatus: 'FREEZE' as const };
    const steps = planTurn(frozen, [ev('Olaf esta congelado!', { enemyStatus: 'FREEZE' })]);
    expect(steps.map((s) => s.kind)).toEqual(['text', 'wait']);
  });

  it('burn damage flashes the burned side and drops its hp', () => {
    const burned = { ...start, playerStatus: 'BURN' as const };
    const steps = planTurn(burned, [
      ev('Lucifer sofreu com a queimadura!', { effect: 'PLAYER_STATUS_DAMAGE', playerHp: 18, playerStatus: 'BURN' }),
    ]);
    expect(steps).toEqual([
      { kind: 'text', text: 'Lucifer sofreu com a queimadura!' },
      { kind: 'flash', side: 'player' },
      { kind: 'hp', side: 'player', to: 18 },
      { kind: 'wait' },
    ]);
  });

  it('animates stat changes on the side that changed', () => {
    const steps = planTurn(start, [
      ev('A defesa de Coiso subiu muito!', { effect: 'PLAYER_STAT_UP' }),
      ev('A velocidade de Olaf caiu muito!', { effect: 'ENEMY_STAT_DOWN' }),
      ev('O ataque de Olaf subiu!', { effect: 'ENEMY_STAT_UP' }),
      ev('O ataque de Coiso caiu!', { effect: 'PLAYER_STAT_DOWN' }),
    ]);
    expect(steps.filter((s) => s.kind === 'stat')).toEqual([
      { kind: 'stat', side: 'player', up: true },
      { kind: 'stat', side: 'enemy', up: false },
      { kind: 'stat', side: 'enemy', up: true },
      { kind: 'stat', side: 'player', up: false },
    ]);
  });

  it('a learned move is just a message', () => {
    const steps = planTurn(start, [ev('Lucifer aprendeu Churrasco grego!', { effect: 'MOVE_LEARNED' })]);
    expect(steps.map((s) => s.kind)).toEqual(['text', 'wait']);
  });

  it('takes the status of the monster that switches in without a badge step', () => {
    const burned = { ...start, playerStatus: 'BURN' as const };
    const steps = planTurn(burned, [
      ev('Vai, Groot!', { effect: 'PLAYER_SWITCH', playerActive: 1, playerHp: 30, playerStatus: 'PARALYSIS' }),
      ev('Olaf usou Cubo de gelo!', { effect: 'PLAYER_HIT', playerActive: 1, playerHp: 25, playerStatus: 'PARALYSIS' }),
    ]);
    expect(steps.filter((s) => s.kind === 'status')).toEqual([]);
  });

  it('clears the enemy badge when a fainted enemy leaves', () => {
    const burned = { ...start, enemyStatus: 'BURN' as const };
    const steps = planTurn(burned, [
      ev('Coiso desmaiou!', { effect: 'ENEMY_FAINT', enemyHp: 0, enemyStatus: 'BURN' }),
      ev('Voce venceu!', { effect: 'WON', enemyHp: 0 }),
    ]);
    expect(steps.filter((s) => s.kind === 'status')).toEqual([{ kind: 'status', side: 'enemy', status: 'NONE' }]);
  });
});

describe('viewOf', () => {
  it('reads the active monster, hp and status of both sides', () => {
    const combatant = (hp: number, status: StatusCondition = 'NONE') => ({
      monsterId: 1, speciesId: 1, name: 'x', element: 'AGUA' as const, level: 5, currentHp: hp, maxHp: 30, fainted: false,
      status, moves: null,
    });
    const battle: Battle = {
      id: 1, status: 'AWAITING_ACTION', playerActive: 1, playerTeam: [combatant(5), combatant(25, 'SLEEP')],
      enemy: combatant(12, 'BURN'), log: [],
    };
    expect(viewOf(battle)).toEqual({ playerActive: 1, playerHp: 25, enemyHp: 12, playerStatus: 'SLEEP', enemyStatus: 'BURN' });
  });
});
