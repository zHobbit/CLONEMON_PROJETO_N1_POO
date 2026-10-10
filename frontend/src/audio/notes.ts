const SEMITONES: Readonly<Record<string, number>> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "A4" -> 69 (numeracao MIDI). Aceita sustenido (#) e bemol (b): "C#5", "Eb3". */
export function noteToMidi(name: string): number {
  const m = /^([A-G])([#b]?)(\d)$/.exec(name);
  if (!m) throw new Error(`Invalid note '${name}'`);
  const accidental = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return (Number(m[3]) + 1) * 12 + SEMITONES[m[1]] + accidental;
}

/** Afinacao padrao: A4 = 440 Hz, temperamento igual. */
export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function noteToFreq(name: string): number {
  return midiToFreq(noteToMidi(name));
}

export function isNote(token: string): boolean {
  return /^[A-G][#b]?\d$/.test(token);
}
