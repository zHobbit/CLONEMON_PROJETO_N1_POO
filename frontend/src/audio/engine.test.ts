import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioEngine } from './engine';
import { compileSong } from './sequencer';
import { type KeyValueStore, MUTE_KEY } from './settings';
import { JINGLES } from './songs';

/** O suficiente da Web Audio API para o motor rodar e registrar o que foi agendado. */
class FakeParam {
  value = 1;
  setValueAtTime() { return this; }
  linearRampToValueAtTime() { return this; }
  exponentialRampToValueAtTime() { return this; }
  cancelScheduledValues() { return this; }
}

class FakeNode {
  connect<T>(node: T): T { return node; }
  disconnect() {}
}

class FakeSource extends FakeNode {
  startedAt = -1;
  constructor(private readonly ctx: FakeContext) { super(); }
  addEventListener() {}
  start(at: number) {
    this.startedAt = at;
    this.ctx.started.push(this);
  }
  stop() {}
}

class FakeContext {
  currentTime = 0;
  sampleRate = 8000;
  state: AudioContextState = 'running';
  destination = new FakeNode();
  started: FakeSource[] = [];
  createGain() { return Object.assign(new FakeNode(), { gain: new FakeParam() }); }
  createOscillator() {
    return Object.assign(new FakeSource(this), { type: 'sine', frequency: new FakeParam(), setPeriodicWave() {} });
  }
  createBufferSource() {
    return Object.assign(new FakeSource(this), { buffer: null, loop: false, playbackRate: new FakeParam() });
  }
  createBuffer(_channels: number, length: number) {
    const data = new Float32Array(length);
    return { getChannelData: () => data };
  }
  createPeriodicWave() { return {}; }
  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
  suspend() {
    this.state = 'suspended';
    return Promise.resolve();
  }
}

function memory(): KeyValueStore {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

function setup(store = memory()) {
  const ctx = new FakeContext();
  const createContext = vi.fn(() => ctx as unknown as AudioContext);
  return { ctx, store, createContext, engine: new AudioEngine({ createContext, store }) };
}

/** Avanca o relogio do audio e deixa o agendador rodar. */
function advance(ctx: FakeContext, seconds: number): void {
  ctx.currentTime += seconds;
  vi.advanceTimersByTime(seconds * 1000);
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AudioEngine without Web Audio', () => {
  it('stays silent and never throws', () => {
    const engine = new AudioEngine({ createContext: () => null, store: null });
    expect(() => {
      engine.playMusic('title');
      engine.unlock();
      engine.sfx('hit');
      engine.playJingle('victory');
      engine.setHidden(true);
      engine.setHidden(false);
      engine.toggleMute();
      engine.toggleMute();
    }).not.toThrow();
    expect(engine.active).toBe(false);
  });

  it('gives up quietly when the browser refuses to create the context', () => {
    const engine = new AudioEngine({
      createContext: () => {
        throw new Error('NotAllowedError');
      },
      store: null,
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(() => engine.unlock()).not.toThrow();
    expect(() => engine.sfx('confirm')).not.toThrow();
    expect(engine.active).toBe(false);
  });
});

describe('AudioEngine', () => {
  it('waits for a user gesture before creating the AudioContext', () => {
    const { engine, createContext, ctx } = setup();
    engine.playMusic('title');
    engine.sfx('cursor');
    expect(createContext).not.toHaveBeenCalled();

    engine.unlock();
    engine.unlock();
    expect(createContext).toHaveBeenCalledTimes(1);
    expect(ctx.started.length).toBeGreaterThan(0); // o tema pedido antes comeca agora
  });

  it('keeps scheduling the looping theme as time passes', () => {
    const { engine, ctx } = setup();
    engine.unlock();
    engine.playMusic('title');
    const first = ctx.started.length;
    advance(ctx, 2);
    expect(ctx.started.length).toBeGreaterThan(first);
    expect(Math.max(...ctx.started.map((s) => s.startedAt))).toBeLessThanOrEqual(ctx.currentTime + 0.25);
  });

  it('asking for the same track does not restart it', () => {
    const { engine, ctx } = setup();
    engine.unlock();
    engine.playMusic('battle');
    const before = ctx.started.length;
    engine.playMusic('battle');
    expect(ctx.started.length).toBe(before);
  });

  it('plays effects right away once unlocked', () => {
    const { engine, ctx } = setup();
    engine.unlock();
    const before = ctx.started.length;
    engine.sfx('strongHit');
    expect(ctx.started.length - before).toBe(3);
  });

  it('a menu theme requested during a jingle waits for it to end', () => {
    const { engine, ctx } = setup();
    engine.unlock();
    engine.playMusic('battle');
    engine.playJingle('victory');
    engine.playMusic('title');
    const jingleEnd = compileSong(JINGLES.victory).duration;
    advance(ctx, jingleEnd - 0.5);
    const titleNotes = () => ctx.started.filter((s) => s.startedAt >= jingleEnd);
    expect(titleNotes()).toHaveLength(0);
    advance(ctx, 1);
    expect(titleNotes().length).toBeGreaterThan(0);
  });

  it('the battle theme cuts a jingle short', () => {
    const { engine, ctx } = setup();
    engine.unlock();
    engine.playJingle('victory');
    const before = ctx.started.length;
    engine.playMusic('battle');
    expect(ctx.started.length).toBeGreaterThan(before);
  });

  it('mute is saved, suspends the audio and silences effects', () => {
    const { engine, ctx, store } = setup();
    engine.unlock();
    expect(engine.toggleMute()).toBe(true);
    expect(store.getItem(MUTE_KEY)).toBe('1');
    expect(ctx.state).toBe('suspended');

    const before = ctx.started.length;
    engine.sfx('hit');
    engine.playJingle('defeat');
    expect(ctx.started.length).toBe(before);

    expect(engine.toggleMute()).toBe(false);
    expect(ctx.state).toBe('running');
    expect(store.getItem(MUTE_KEY)).toBe('0');
  });

  it('a saved mute is respected on the next visit: no context until unmuted', () => {
    const store = memory();
    store.setItem(MUTE_KEY, '1');
    const { engine, createContext } = setup(store);
    expect(engine.muted).toBe(true);
    engine.unlock();
    expect(createContext).not.toHaveBeenCalled();
    engine.setMuted(false); // a propria tecla M e um gesto
    expect(createContext).toHaveBeenCalledTimes(1);
  });

  it('notifies listeners when mute changes', () => {
    const { engine } = setup();
    const seen: boolean[] = [];
    const off = engine.onMuteChange((m) => seen.push(m));
    engine.toggleMute();
    engine.setMuted(true); // sem mudanca, sem aviso
    engine.toggleMute();
    off();
    engine.toggleMute();
    expect(seen).toEqual([true, false]);
  });

  it('pauses while the tab is hidden', () => {
    const { engine, ctx } = setup();
    engine.unlock();
    engine.setHidden(true);
    expect(ctx.state).toBe('suspended');
    engine.unlock(); // tecla com a aba escondida nao religa
    expect(ctx.state).toBe('suspended');
    engine.setHidden(false);
    expect(ctx.state).toBe('running');
  });
});
