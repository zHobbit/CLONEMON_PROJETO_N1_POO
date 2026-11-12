export type Backdrop = 'field' | 'dusk' | 'night' | 'town';

export const BACKDROPS: readonly Backdrop[] = ['field', 'dusk', 'night', 'town'];

/**
 * Cenario da batalha: contra treinador e sempre na vila; na selvagem acompanha a hora do
 * relogio do jogador (campo de dia, por do sol no fim da tarde, noite depois).
 */
export function pickBackdrop(npcId: string | null, hour: number): Backdrop {
  if (npcId !== null) return 'town';
  if (hour >= 19 || hour < 6) return 'night';
  if (hour >= 17) return 'dusk';
  return 'field';
}
