import { describe, expect, it } from 'vitest';
import { noteToFreq } from './notes';
import { type Song, compileSong, eventsBetween, noteTone, parsePattern } from './sequencer';
import { SFX } from './sfx';
import { JINGLES, TRACKS } from './songs';

describe('parsePattern', () => {
  it('reads notes, holds and rests', () => {
    const { notes, steps } = parsePattern('pulse1', 'C5 - - . E5 - G5');
    expect(steps).toBe(7);
    expect(notes).toEqual([
      { channel: 'pulse1', step: 0, steps: 3, freq: noteToFreq('C5') },
      { channel: 'pulse1', step: 4, steps: 2, freq: noteToFreq('E5') },
      { channel: 'pulse1', step: 6, steps: 1, freq: noteToFreq('G5') },
    ]);
  });

  it('a hold after a rest stays silent', () => {
    const { notes } = parsePattern('triangle', '. - C3');
    expect(notes).toEqual([{ channel: 'triangle', step: 2, steps: 1, freq: noteToFreq('C3') }]);
  });

  it('reads drums on the noise channel', () => {
    const { notes } = parsePattern('noise', 'k . h s');
    expect(notes.map((n) => [n.step, n.drum])).toEqual([[0, 'k'], [2, 'h'], [3, 's']]);
  });

  it('rejects typos instead of playing garbage', () => {
    expect(() => parsePattern('pulse1', 'C5 X5')).toThrow(/Invalid note/);
    expect(() => parsePattern('noise', 'k C5')).toThrow(/Invalid drum/);
  });
});

const tiny: Song = {
  bpm: 120,
  stepsPerBeat: 2,
  loop: true,
  voices: { pulse1: ['C5 - E5 .'], noise: ['k . s .'] },
};

describe('compileSong', () => {
  it('computes the step length and total duration from the tempo', () => {
    const c = compileSong(tiny);
    expect(c.stepSec).toBeCloseTo(0.25, 10); // 120 bpm, colcheias
    expect(c.steps).toBe(4);
    expect(c.duration).toBeCloseTo(1, 10);
  });

  it('merges channels sorted by step', () => {
    expect(compileSong(tiny).notes.map((n) => n.step)).toEqual([0, 0, 2, 2]);
  });

  it('refuses channels of different lengths', () => {
    expect(() => compileSong({ ...tiny, voices: { pulse1: ['C5 -'], noise: ['k . s'] } })).toThrow(/steps/);
  });
});

describe('eventsBetween', () => {
  const song = compileSong(tiny);

  it('returns the notes that start inside the window', () => {
    expect(eventsBetween(song, 0, 0.3).map((e) => e.time)).toEqual([0, 0]);
    expect(eventsBetween(song, 0.3, 0.6).map((e) => e.time)).toEqual([0.5, 0.5]);
  });

  it('loops: the next lap is shifted by the song duration', () => {
    const events = eventsBetween(song, 0.9, 1.1);
    expect(events.map((e) => e.time)).toEqual([1, 1]);
    expect(events.map((e) => e.note.step)).toEqual([0, 0]);
  });

  it('back-to-back windows schedule every note exactly once', () => {
    const whole = eventsBetween(song, 0, 3.05).map((e) => e.time);
    const pieces: number[] = [];
    for (let t = 0; t < 3.05; t += 0.07) pieces.push(...eventsBetween(song, t, Math.min(t + 0.07, 3.05)).map((e) => e.time));
    expect(pieces).toEqual(whole);
    expect(whole).toHaveLength(4 * 3 + 2);
  });

  it('a song without loop ends', () => {
    const once = compileSong({ ...tiny, loop: false });
    expect(eventsBetween(once, 0.9, 5)).toEqual([]);
  });

  it('empty or inverted windows return nothing', () => {
    expect(eventsBetween(song, 0.5, 0.5)).toEqual([]);
    expect(eventsBetween(song, 0.6, 0.2)).toEqual([]);
  });
});

describe('noteTone', () => {
  it('lead notes are 25% pulses that stop a bit before the next step', () => {
    const [lead] = compileSong(tiny).notes;
    const tone = noteTone(lead, 0.25);
    expect(tone.wave).toBe('pulse25');
    expect(tone.from).toBeCloseTo(noteToFreq('C5'));
    expect(tone.dur).toBeGreaterThan(0.25);
    expect(tone.dur).toBeLessThan(0.5);
  });

  it('the kick is a falling triangle and the snare is noise', () => {
    const drums = compileSong(tiny).notes.filter((n) => n.drum);
    const [kick, snare] = drums.map((n) => noteTone(n, 0.25));
    expect(kick.wave).toBe('triangle');
    expect(kick.to).toBeLessThan(kick.from);
    expect(snare.wave).toBe('noise');
  });
});

describe('game songs', () => {
  const all = { ...TRACKS, ...JINGLES };

  it.each(Object.entries(all))('%s has 16-step bars and compiles', (_, song) => {
    const bars = Object.values(song.voices).map((b) => b!.length);
    for (const voice of Object.values(song.voices)) {
      for (const bar of voice!) expect(bar.trim().split(/\s+/)).toHaveLength(16);
    }
    expect(new Set(bars).size).toBe(1);
    const c = compileSong(song);
    expect(c.notes.length).toBeGreaterThan(0);
  });

  it('themes loop and jingles are short one-shots', () => {
    for (const song of Object.values(TRACKS)) expect(song.loop).toBe(true);
    for (const song of Object.values(JINGLES)) {
      expect(song.loop).toBe(false);
      expect(compileSong(song).duration).toBeLessThan(5);
    }
  });

  it('only the battle theme interrupts a jingle', () => {
    expect(compileSong(TRACKS.battle).urgent).toBe(true);
    expect(compileSong(TRACKS.title).urgent).toBe(false);
  });

  it('the battle theme is faster than the title theme', () => {
    expect(TRACKS.battle.bpm).toBeGreaterThan(TRACKS.title.bpm);
  });
});

describe('sound effects', () => {
  it.each(Object.entries(SFX))('%s is short, audible and within volume limits', (_, tones) => {
    expect(tones.length).toBeGreaterThan(0);
    for (const t of tones) {
      expect(t.dur).toBeGreaterThan(0);
      expect(t.vol).toBeGreaterThan(0);
      expect(t.vol).toBeLessThanOrEqual(1);
      expect(t.from).toBeGreaterThan(0);
      if (t.to !== undefined) expect(t.to).toBeGreaterThan(0);
    }
    expect(Math.max(...tones.map((t) => t.start + t.dur))).toBeLessThan(1.2);
  });

  it('the text blip is the quietest and the strong hit is louder than a normal hit', () => {
    const peak = (name: keyof typeof SFX) => Math.max(...SFX[name].map((t) => t.vol));
    for (const name of Object.keys(SFX) as (keyof typeof SFX)[]) expect(peak('text')).toBeLessThanOrEqual(peak(name));
    expect(peak('strongHit')).toBeGreaterThan(peak('hit'));
    const length = (name: keyof typeof SFX) => Math.max(...SFX[name].map((t) => t.start + t.dur));
    expect(length('strongHit')).toBeGreaterThan(length('hit'));
  });
});
