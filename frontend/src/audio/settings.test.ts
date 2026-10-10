import { describe, expect, it } from 'vitest';
import { type KeyValueStore, MUTE_KEY, browserStore, loadMuted, saveMuted } from './settings';

function memory(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

const broken: KeyValueStore = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
};

describe('mute setting', () => {
  it('starts with sound on', () => {
    expect(loadMuted(memory())).toBe(false);
  });

  it('round-trips through the store', () => {
    const store = memory();
    saveMuted(store, true);
    expect(store.data.get(MUTE_KEY)).toBe('1');
    expect(loadMuted(store)).toBe(true);
    saveMuted(store, false);
    expect(loadMuted(store)).toBe(false);
  });

  it('survives a store that throws or does not exist', () => {
    expect(loadMuted(broken)).toBe(false);
    expect(() => saveMuted(broken, true)).not.toThrow();
    expect(loadMuted(null)).toBe(false);
    expect(() => saveMuted(null, true)).not.toThrow();
  });

  it('has no browser store under Node', () => {
    expect(browserStore()).toBeNull();
  });
});
