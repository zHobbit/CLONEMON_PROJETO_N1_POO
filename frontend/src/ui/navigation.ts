export type Key = 'confirm' | 'cancel' | 'up' | 'down' | 'left' | 'right';
export type Direction = Extract<Key, 'up' | 'down' | 'left' | 'right'>;

const KEYS: Record<string, Key> = {
  Enter: 'confirm',
  ' ': 'confirm',
  z: 'confirm',
  Z: 'confirm',
  Escape: 'cancel',
  Backspace: 'cancel',
  x: 'cancel',
  X: 'cancel',
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

/** Teclas do jogo: Enter/Espaco/Z confirmam, Esc/Backspace/X cancelam, setas navegam. */
export function mapKey(key: string): Key | undefined {
  return KEYS[key];
}

export function isDirection(key: Key): key is Direction {
  return key === 'up' || key === 'down' || key === 'left' || key === 'right';
}

/** Move o cursor numa grade de {@code columns} colunas, sem sair dos limites. */
export function moveCursor(index: number, dir: Direction, count: number, columns = 1): number {
  const col = index % columns;
  let next = index;
  if (dir === 'up') next = index - columns;
  else if (dir === 'down') next = index + columns;
  else if (dir === 'left' && col > 0) next = index - 1;
  else if (dir === 'right' && col < columns - 1) next = index + 1;
  return next >= 0 && next < count ? next : index;
}
