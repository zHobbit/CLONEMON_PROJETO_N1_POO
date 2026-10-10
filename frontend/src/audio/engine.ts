import { type CompiledSong, type Song, type Tone, type Wave, compileSong, eventsBetween, noteTone } from './sequencer';
import { browserStore, type KeyValueStore, loadMuted, saveMuted } from './settings';
import { SFX, type SfxName } from './sfx';
import { JINGLES, type JingleName, TRACKS, type Track } from './songs';
import { lfsrNoise, pulseWave } from './waves';

/** Volumes modestos: ondas quadradas cansam rapido. */
const MASTER = 0.22;
const MUSIC = 0.45;
const EFFECTS = 1;
/** O agendador acorda a cada TICK_MS e agenda as notas dos proximos LOOKAHEAD segundos. */
const TICK_MS = 40;
const LOOKAHEAD = 0.2;
const DUTY: Partial<Record<Wave, number>> = { pulse12: 0.125, pulse25: 0.25, pulse50: 0.5 };

const noop = () => {};

export interface EngineOptions {
  /** Cria o AudioContext; devolve null quando nao ha Web Audio. */
  createContext?: () => AudioContext | null;
  /** Onde guardar o "mudo"; null para nao guardar. Padrao: localStorage. */
  store?: KeyValueStore | null;
}

function browserContext(): AudioContext | null {
  const g = globalThis as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  const Ctor = g.AudioContext ?? g.webkitAudioContext;
  return Ctor ? new Ctor() : null;
}

/** Os nos fixos do grafo de audio e a fabrica de sons. */
class Synth {
  readonly master: GainNode;
  readonly musicBus: GainNode;
  readonly sfxBus: GainNode;
  private readonly waves = new Map<Wave, PeriodicWave>();
  private readonly noise: AudioBuffer;

  constructor(readonly ctx: AudioContext) {
    this.master = ctx.createGain();
    this.master.gain.value = MASTER;
    this.master.connect(ctx.destination);
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = MUSIC;
    this.musicBus.connect(this.master);
    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = EFFECTS;
    this.sfxBus.connect(this.master);
    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    this.noise.getChannelData(0).set(lfsrNoise(ctx.sampleRate));
  }

  /** Agenda um som no tempo absoluto `at` (relogio do AudioContext). */
  play(t: Tone, at: number, out: AudioNode): AudioScheduledSourceNode {
    const start = Math.max(at + t.start, this.ctx.currentTime);
    const end = start + t.dur;
    // Envelope de volume como o do Game Boy: ataque imediato e queda linear.
    const gain = this.ctx.createGain();
    const g = gain.gain;
    g.setValueAtTime(0, start);
    g.linearRampToValueAtTime(t.vol, start + Math.min(0.004, t.dur / 4));
    g.linearRampToValueAtTime(t.vol * (t.sustain ?? 1), end - Math.min(0.012, t.dur / 4));
    g.linearRampToValueAtTime(0, end);

    const src = t.wave === 'noise' ? this.noiseSource(t, start, end) : this.oscillator(t, start, end);
    src.connect(gain);
    gain.connect(out);
    src.addEventListener('ended', () => {
      src.disconnect();
      gain.disconnect();
    });
    src.start(start);
    src.stop(end + 0.02);
    return src;
  }

  private oscillator(t: Tone, start: number, end: number): OscillatorNode {
    const o = this.ctx.createOscillator();
    if (t.wave === 'triangle') o.type = 'triangle';
    else o.setPeriodicWave(this.periodic(t.wave));
    o.frequency.setValueAtTime(t.from, start);
    if (t.to !== undefined) o.frequency.exponentialRampToValueAtTime(Math.max(1, t.to), end);
    return o;
  }

  private noiseSource(t: Tone, start: number, end: number): AudioBufferSourceNode {
    const b = this.ctx.createBufferSource();
    b.buffer = this.noise;
    b.loop = true;
    b.playbackRate.setValueAtTime(t.from, start);
    if (t.to !== undefined) b.playbackRate.exponentialRampToValueAtTime(Math.max(0.01, t.to), end);
    return b;
  }

  private periodic(wave: Wave): PeriodicWave {
    let p = this.waves.get(wave);
    if (!p) {
      const { real, imag } = pulseWave(DUTY[wave] ?? 0.5);
      p = this.ctx.createPeriodicWave(real, imag);
      this.waves.set(wave, p);
    }
    return p;
  }
}

/** Toca uma musica agendando as notas aos poucos, um pouco a frente do relogio do audio. */
class SongPlayer {
  private readonly out: GainNode;
  private readonly sources = new Set<AudioScheduledSourceNode>();
  private readonly timer: ReturnType<typeof setInterval>;
  private cursor: number;

  constructor(
    private readonly synth: Synth,
    private readonly song: CompiledSong,
    private readonly startAt: number,
    bus: AudioNode,
  ) {
    this.out = synth.ctx.createGain();
    this.out.connect(bus);
    this.cursor = startAt;
    this.timer = setInterval(() => this.tick(), TICK_MS);
    this.tick();
  }

  /** Fim da musica no relogio do audio (infinito se ela repete). */
  get endsAt(): number {
    return this.song.loop ? Infinity : this.startAt + this.song.duration;
  }

  stop(fade: number): void {
    clearInterval(this.timer);
    try {
      const now = this.synth.ctx.currentTime;
      const g = this.out.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(0, now + fade);
      for (const s of this.sources) s.stop(now + fade);
      setTimeout(() => this.out.disconnect(), (fade + 0.5) * 1000);
    } catch {
      /* contexto ja fechado */
    }
  }

  private tick(): void {
    try {
      const horizon = this.synth.ctx.currentTime + LOOKAHEAD;
      if (horizon <= this.cursor) return;
      for (const { note, time } of eventsBetween(this.song, this.cursor - this.startAt, horizon - this.startAt)) {
        const src = this.synth.play(noteTone(note, this.song.stepSec), this.startAt + time, this.out);
        this.sources.add(src);
        src.addEventListener('ended', () => this.sources.delete(src));
      }
      this.cursor = horizon;
      if (this.cursor >= this.endsAt) clearInterval(this.timer);
    } catch {
      clearInterval(this.timer);
    }
  }
}

/**
 * Musica e efeitos sonoros sintetizados com Web Audio, sem arquivos de audio.
 * Sem Web Audio (testes, navegador antigo) tudo vira no-op e o jogo segue mudo.
 */
export class AudioEngine {
  private synth: Synth | null = null;
  private failed = false;
  private gesture = false;
  private hidden = false;
  private mutedState: boolean;
  private readonly store: KeyValueStore | null;
  /** Musica pedida pela cena atual e a que esta tocando de fato. */
  private wanted: Track | null = null;
  private playing: Track | null = null;
  private music: SongPlayer | null = null;
  private jingle: SongPlayer | null = null;
  private readonly compiled = new Map<Song, CompiledSong>();
  private readonly listeners = new Set<(muted: boolean) => void>();

  constructor(private readonly options: EngineOptions = {}) {
    this.store = options.store === undefined ? browserStore() : options.store;
    this.mutedState = loadMuted(this.store);
  }

  get muted(): boolean {
    return this.mutedState;
  }

  /** Ha um AudioContext criado (so depois do primeiro gesto e se o navegador tiver Web Audio). */
  get active(): boolean {
    return this.synth !== null;
  }

  /** Chamado a cada tecla ou clique: o navegador so libera o som depois de um gesto do jogador. */
  unlock(): void {
    this.gesture = true;
    if (this.mutedState || this.hidden) return;
    this.guard(() => {
      if (!this.synth) this.boot();
      else if (this.synth.ctx.state === 'suspended') this.resume();
    });
  }

  /** Troca a musica de fundo. Pedir a mesma musica nao a reinicia. */
  playMusic(track: Track | null): void {
    this.wanted = track;
    this.guard(() => this.startWanted());
  }

  /** Para a musica e toca uma fanfarra curta. A proxima musica pedida espera ela acabar. */
  playJingle(name: JingleName, delay = 0): void {
    this.guard(() => {
      this.music?.stop(0.25);
      this.music = null;
      this.wanted = null;
      this.playing = null;
      this.stopJingle();
      const s = this.synth;
      if (!s || this.mutedState) return;
      this.jingle = new SongPlayer(s, this.compile(JINGLES[name]), s.ctx.currentTime + delay, s.musicBus);
    });
  }

  sfx(name: SfxName): void {
    this.guard(() => {
      const s = this.synth;
      if (!s || this.mutedState || s.ctx.state !== 'running') return;
      const at = s.ctx.currentTime;
      for (const tone of SFX[name]) s.play(tone, at, s.sfxBus);
    });
  }

  setMuted(muted: boolean): void {
    if (muted === this.mutedState) return;
    this.mutedState = muted;
    saveMuted(this.store, muted);
    this.guard(() => {
      if (muted) this.suspend();
      else if (this.gesture && !this.hidden) {
        if (this.synth) this.resume();
        else this.boot();
      }
    });
    for (const listener of this.listeners) listener(muted);
  }

  toggleMute(): boolean {
    this.setMuted(!this.mutedState);
    return this.mutedState;
  }

  /** Aba em segundo plano: pausa tudo (timers ficam lentos e a musica engasgaria). */
  setHidden(hidden: boolean): void {
    this.hidden = hidden;
    this.guard(() => {
      if (hidden) this.suspend();
      else if (!this.mutedState) this.resume();
    });
  }

  onMuteChange(listener: (muted: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private boot(): void {
    if (this.synth || this.failed) return;
    const ctx = (this.options.createContext ?? browserContext)();
    if (!ctx) {
      this.failed = true;
      return;
    }
    this.synth = new Synth(ctx);
    this.resume();
    this.startWanted();
  }

  private startWanted(): void {
    const s = this.synth;
    if (!s || this.wanted === this.playing) return;
    this.music?.stop(0.15);
    this.music = null;
    this.playing = this.wanted;
    if (!this.wanted) return;
    const song = this.compile(TRACKS[this.wanted]);
    if (song.urgent) this.stopJingle();
    const at = Math.max(s.ctx.currentTime + 0.05, this.jingle?.endsAt ?? 0);
    this.music = new SongPlayer(s, song, at, s.musicBus);
  }

  private stopJingle(): void {
    this.jingle?.stop(0.05);
    this.jingle = null;
  }

  private suspend(): void {
    if (!this.synth) return;
    this.synth.master.gain.value = 0;
    void this.synth.ctx.suspend().catch(noop);
  }

  private resume(): void {
    if (!this.synth) return;
    this.synth.master.gain.value = MASTER;
    void this.synth.ctx.resume().catch(noop);
  }

  private compile(song: Song): CompiledSong {
    let c = this.compiled.get(song);
    if (!c) {
      c = compileSong(song);
      this.compiled.set(song, c);
    }
    return c;
  }

  /** Um erro de audio nunca pode derrubar o jogo: o som e desligado de vez. */
  private guard(fn: () => void): void {
    if (this.failed) return;
    try {
      fn();
    } catch (e) {
      this.failed = true;
      this.music?.stop(0);
      this.jingle?.stop(0);
      this.synth = null;
      console.warn('Audio desativado:', e);
    }
  }
}
