import type { Element } from '../api/types';

/** Ciclo de vantagens, igual ao do backend: cada elemento vence o proximo. */
const CYCLE: readonly Element[] = ['AGUA', 'ROCHA', 'FOGO', 'GELO', 'GRAMA', 'RAIO'];

/** Multiplicador de dano: 2 contra o proximo do ciclo, 0,5 contra o anterior, 1 contra os demais. */
export function effectiveness(attack: Element, defend: Element): number {
  const a = CYCLE.indexOf(attack);
  const d = CYCLE.indexOf(defend);
  if (d === (a + 1) % CYCLE.length) return 2;
  if (a === (d + 1) % CYCLE.length) return 0.5;
  return 1;
}
