import type { Terrain } from './maps';

/** Chance de um CLONEMON selvagem aparecer a cada passo no capim alto. */
export const ENCOUNTER_RATE = 0.12;

export type Rng = () => number;

/** Sorteio de encontro ao terminar um passo; so acontece no capim alto. */
export function rollEncounter(terrain: Terrain | null, rng: Rng = Math.random): boolean {
  return terrain === 'tallGrass' && rng() < ENCOUNTER_RATE;
}
