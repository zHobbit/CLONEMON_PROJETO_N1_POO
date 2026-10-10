import { isNote, noteToFreq } from './notes';

/** Timbres disponiveis: pulsos (12,5%, 25%, 50%), triangulo e ruido. */
export type Wave = 'pulse12' | 'pulse25' | 'pulse50' | 'triangle' | 'noise';

/** Um som simples: uma onda, um volume e um tempo. Musica e efeitos viram listas de Tone. */
export interface Tone {
  wave: Wave;
  /** Frequencia em Hz; no ruido, a taxa de reproducao (1 = cheia, menor = mais grave). */
  from: number;
  /** Desliza ate este valor no fim do som. */
  to?: number;
  /** Inicio, em segundos, relativo ao disparo. */
  start: number;
  dur: number;
  /** 0 a 1, antes dos volumes do canal e do mestre. */
  vol: number;
  /** Fracao do volume que sobra no fim (1 = constante, 0 = some). Padrao: 1. */
  sustain?: number;
}

/** Os quatro canais do Game Boy. */
export type Channel = 'pulse1' | 'pulse2' | 'triangle' | 'noise';
/** Bateria no canal de ruido: bumbo, caixa e chimbal. */
export type Drum = 'k' | 's' | 'h';

/**
 * Musica em notacao de tracker: cada compasso e uma string de passos separados por espaco.
 * "C5" toca uma nota, "-" segura a nota anterior, "." e silencio. No ruido: k, s ou h.
 */
export interface Song {
  bpm: number;
  /** Passos por batida; 4 = semicolcheias. */
  stepsPerBeat: number;
  loop: boolean;
  /** Corta jingles em andamento (a batalha nao espera a fanfarra acabar). */
  urgent?: boolean;
  voices: Partial<Record<Channel, readonly string[]>>;
}

export interface SongNote {
  channel: Channel;
  step: number;
  steps: number;
  /** Hz; 0 na bateria. */
  freq: number;
  drum?: Drum;
}

export interface CompiledSong {
  stepSec: number;
  steps: number;
  duration: number;
  loop: boolean;
  urgent: boolean;
  /** Ordenadas por passo. */
  notes: SongNote[];
}

const DRUMS: readonly string[] = ['k', 's', 'h'];

/** Le um canal inteiro (compassos ja juntos) e devolve as notas com inicio e duracao em passos. */
export function parsePattern(channel: Channel, pattern: string): { notes: SongNote[]; steps: number } {
  const tokens = pattern.trim().split(/\s+/).filter(Boolean);
  const notes: SongNote[] = [];
  let current: SongNote | null = null;
  tokens.forEach((token, step) => {
    if (token === '-') {
      if (current) current.steps++;
      return;
    }
    current = null;
    if (token === '.') return;
    if (channel === 'noise') {
      if (!DRUMS.includes(token)) throw new Error(`Invalid drum '${token}'`);
      current = { channel, step, steps: 1, freq: 0, drum: token as Drum };
    } else {
      if (!isNote(token)) throw new Error(`Invalid note '${token}'`);
      current = { channel, step, steps: 1, freq: noteToFreq(token) };
    }
    notes.push(current);
  });
  return { notes, steps: tokens.length };
}

/** Junta os compassos de cada canal; todos os canais precisam ter o mesmo numero de passos. */
export function compileSong(song: Song): CompiledSong {
  const notes: SongNote[] = [];
  let steps = -1;
  for (const [channel, bars] of Object.entries(song.voices) as [Channel, readonly string[]][]) {
    const parsed = parsePattern(channel, bars.join(' '));
    if (steps >= 0 && parsed.steps !== steps) throw new Error(`Channel ${channel} has ${parsed.steps} steps, expected ${steps}`);
    steps = parsed.steps;
    notes.push(...parsed.notes);
  }
  notes.sort((a, b) => a.step - b.step);
  const stepSec = 60 / song.bpm / song.stepsPerBeat;
  steps = Math.max(0, steps);
  return { stepSec, steps, duration: steps * stepSec, loop: song.loop, urgent: song.urgent ?? false, notes };
}

/**
 * Notas que comecam no intervalo [from, to), em segundos desde o inicio da musica.
 * Em musicas com loop, as voltas seguintes aparecem deslocadas pela duracao.
 */
export function eventsBetween(song: CompiledSong, from: number, to: number): { note: SongNote; time: number }[] {
  const out: { note: SongNote; time: number }[] = [];
  if (to <= from || song.duration <= 0) return out;
  const firstLap = song.loop ? Math.max(0, Math.floor(from / song.duration)) : 0;
  const lastLap = song.loop ? Math.floor(to / song.duration) : 0;
  for (let lap = firstLap; lap <= lastLap; lap++) {
    for (const note of song.notes) {
      const time = lap * song.duration + note.step * song.stepSec;
      if (time >= from && time < to) out.push({ note, time });
    }
  }
  return out;
}

/** Volume e envelope de cada canal (o pulso 2 e mais baixo, para acompanhar). */
const CHANNEL: Record<Exclude<Channel, 'noise'>, { wave: Wave; vol: number; sustain: number; gate: number }> = {
  pulse1: { wave: 'pulse25', vol: 0.5, sustain: 0.55, gate: 0.9 },
  pulse2: { wave: 'pulse12', vol: 0.3, sustain: 0.5, gate: 0.85 },
  triangle: { wave: 'triangle', vol: 0.75, sustain: 1, gate: 0.95 },
};

const DRUM_TONES: Record<Drum, Tone> = {
  // Bumbo: triangulo caindo de tom, como os jogos de GB faziam com o canal de onda.
  k: { wave: 'triangle', from: 160, to: 45, start: 0, dur: 0.11, vol: 0.9, sustain: 0.2 },
  s: { wave: 'noise', from: 0.5, start: 0, dur: 0.12, vol: 0.4, sustain: 0 },
  h: { wave: 'noise', from: 1, start: 0, dur: 0.035, vol: 0.2, sustain: 0 },
};

/** Transforma uma nota da musica no som que o motor toca. */
export function noteTone(note: SongNote, stepSec: number): Tone {
  if (note.drum) return DRUM_TONES[note.drum];
  if (note.channel === 'noise') throw new Error('Noise notes must be drums');
  const c = CHANNEL[note.channel];
  return { wave: c.wave, from: note.freq, start: 0, dur: note.steps * stepSec * c.gate, vol: c.vol, sustain: c.sustain };
}
