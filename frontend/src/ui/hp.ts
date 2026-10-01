export const HP_GREEN = 0x48c048;
export const HP_YELLOW = 0xf0c030;
export const HP_RED = 0xe04038;

/** Verde acima de 50%, amarelo acima de 20%, vermelho abaixo. */
export function hpColor(hp: number, max: number): number {
  const ratio = max > 0 ? hp / max : 0;
  if (ratio > 0.5) return HP_GREEN;
  if (ratio > 0.2) return HP_YELLOW;
  return HP_RED;
}

/** Largura preenchida da barra; nunca some enquanto o monstro tem HP. */
export function hpFillWidth(hp: number, max: number, width: number): number {
  if (hp <= 0 || max <= 0) return 0;
  return Math.max(1, Math.round((width * Math.min(hp, max)) / max));
}

/** "  7/ 23" — alinhado para a fonte monoespacada. */
export function formatHp(hp: number, max: number): string {
  return `${String(Math.max(0, Math.round(hp))).padStart(3)}/${String(max).padStart(3)}`;
}
