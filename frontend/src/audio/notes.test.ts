import { describe, expect, it } from 'vitest';
import { isNote, midiToFreq, noteToFreq, noteToMidi } from './notes';

describe('noteToMidi', () => {
  it('uses the MIDI numbering, with C4 as middle C', () => {
    expect(noteToMidi('A4')).toBe(69);
    expect(noteToMidi('C4')).toBe(60);
    expect(noteToMidi('C0')).toBe(12);
  });

  it('handles sharps and flats', () => {
    expect(noteToMidi('C#4')).toBe(61);
    expect(noteToMidi('Db4')).toBe(61);
    expect(noteToMidi('B3')).toBe(noteToMidi('C4') - 1);
    expect(noteToMidi('G#5')).toBe(noteToMidi('Ab5'));
  });

  it('rejects anything that is not a note', () => {
    expect(() => noteToMidi('H4')).toThrow(/Invalid note/);
    expect(() => noteToMidi('C')).toThrow(/Invalid note/);
    expect(() => noteToMidi('-')).toThrow(/Invalid note/);
  });
});

describe('frequencies', () => {
  it('tunes A4 to 440 Hz and doubles every octave', () => {
    expect(noteToFreq('A4')).toBe(440);
    expect(noteToFreq('A5')).toBeCloseTo(880, 6);
    expect(noteToFreq('A3')).toBeCloseTo(220, 6);
  });

  it('matches equal temperament', () => {
    expect(noteToFreq('C4')).toBeCloseTo(261.626, 2);
    expect(midiToFreq(70) / midiToFreq(69)).toBeCloseTo(2 ** (1 / 12), 10);
  });
});

describe('isNote', () => {
  it('accepts note names and refuses tracker symbols', () => {
    expect(isNote('E5')).toBe(true);
    expect(isNote('F#3')).toBe(true);
    expect(isNote('.')).toBe(false);
    expect(isNote('k')).toBe(false);
  });
});
