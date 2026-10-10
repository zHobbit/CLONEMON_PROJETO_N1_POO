/** O minimo de Storage que o audio usa (facilita testar com um objeto qualquer). */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const MUTE_KEY = 'clonemon.muted';

/** localStorage pode nem existir (Node) ou lancar erro (modo privado, cookies bloqueados). */
export function browserStore(): KeyValueStore | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function loadMuted(store: KeyValueStore | null): boolean {
  try {
    return store?.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveMuted(store: KeyValueStore | null, muted: boolean): void {
  try {
    store?.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* sem onde salvar: vale so ate recarregar */
  }
}
