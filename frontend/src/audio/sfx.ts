import { noteToFreq } from './notes';
import type { Tone, Wave } from './sequencer';

export type SfxName = 'cursor' | 'confirm' | 'cancel' | 'text' | 'hit' | 'strongHit' | 'faint' | 'heal' | 'levelUp';

const note = (wave: Wave, name: string, start: number, dur: number, vol: number, sustain = 0.6): Tone => ({
  wave, from: noteToFreq(name), start, dur, vol, sustain,
});

/** Notas em sequencia, cada uma com a mesma duracao. */
const run = (wave: Wave, names: readonly string[], start: number, each: number, vol: number): Tone[] =>
  names.map((name, i) => note(wave, name, start + i * each, each, vol));

export const SFX: Readonly<Record<SfxName, readonly Tone[]>> = {
  cursor: [note('pulse25', 'B5', 0, 0.035, 0.5)],
  confirm: [note('pulse50', 'A5', 0, 0.045, 0.45), note('pulse50', 'E6', 0.045, 0.07, 0.45)],
  cancel: [note('pulse50', 'E5', 0, 0.045, 0.42), note('pulse50', 'A4', 0.045, 0.07, 0.42)],
  // Bem discreto: toca a cada mensagem que o jogador avanca.
  text: [note('pulse12', 'A6', 0, 0.018, 0.2, 0.3)],
  hit: [
    { wave: 'noise', from: 0.6, to: 0.15, start: 0, dur: 0.14, vol: 0.55, sustain: 0 },
    { wave: 'pulse50', from: 220, to: 70, start: 0, dur: 0.1, vol: 0.22, sustain: 0.2 },
  ],
  // Super efetivo ou golpe pesado: mais alto, mais longo e mais grave.
  strongHit: [
    { wave: 'noise', from: 1, to: 0.08, start: 0, dur: 0.32, vol: 0.85, sustain: 0 },
    { wave: 'pulse25', from: 330, to: 55, start: 0, dur: 0.22, vol: 0.35, sustain: 0.2 },
    { wave: 'triangle', from: 150, to: 40, start: 0, dur: 0.25, vol: 0.8, sustain: 0.1 },
  ],
  faint: [
    { wave: 'pulse50', from: 900, to: 90, start: 0, dur: 0.6, vol: 0.45, sustain: 0.2 },
    { wave: 'pulse12', from: 906, to: 91, start: 0.03, dur: 0.6, vol: 0.25, sustain: 0.1 },
  ],
  heal: [
    ...run('pulse25', ['C5', 'E5', 'G5', 'C6', 'E5', 'G5', 'C6', 'E6'], 0, 0.07, 0.28),
    note('pulse25', 'G6', 0.56, 0.32, 0.28, 0.3),
    note('pulse12', 'E6', 0.56, 0.32, 0.2, 0.3),
    note('triangle', 'C4', 0.56, 0.32, 0.6, 0.5),
  ],
  levelUp: [
    ...run('pulse25', ['G5', 'C6', 'E6'], 0, 0.08, 0.3),
    note('pulse25', 'G6', 0.24, 0.36, 0.3, 0.4),
    ...run('pulse12', ['E5', 'G5', 'C6'], 0, 0.08, 0.18),
    note('pulse12', 'E6', 0.24, 0.36, 0.18, 0.4),
    note('triangle', 'C4', 0.24, 0.36, 0.6, 0.6),
  ],
};
