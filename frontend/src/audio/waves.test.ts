import { describe, expect, it } from 'vitest';
import { lfsrNoise, pulseWave } from './waves';

describe('pulseWave', () => {
  it('a 50% pulse is a square wave: only odd harmonics, falling as 1/n', () => {
    const { real, imag } = pulseWave(0.5, 8);
    expect(real[1]).toBeCloseTo(2 / Math.PI, 6);
    expect(Math.abs(real[3])).toBeCloseTo(2 / (3 * Math.PI), 6);
    for (const n of [2, 4, 6, 8]) expect(real[n]).toBeCloseTo(0, 6);
    expect([...imag].every((v) => v === 0)).toBe(true);
  });

  it('a 25% pulse loses every 4th harmonic and keeps the others', () => {
    const { real } = pulseWave(0.25, 8);
    expect(real[4]).toBeCloseTo(0, 6);
    expect(real[8]).toBeCloseTo(0, 6);
    expect(real[2]).not.toBeCloseTo(0, 3);
  });

  it('has one slot per harmonic plus the DC term, which stays at zero', () => {
    const { real, imag } = pulseWave(0.125, 32);
    expect(real).toHaveLength(33);
    expect(imag).toHaveLength(33);
    expect(real[0]).toBe(0);
  });
});

describe('lfsrNoise', () => {
  it('outputs only +1 and -1, roughly balanced', () => {
    const noise = lfsrNoise(32767);
    expect([...noise].every((v) => v === 1 || v === -1)).toBe(true);
    const mean = noise.reduce((a, b) => a + b, 0) / noise.length;
    expect(Math.abs(mean)).toBeLessThan(0.01);
  });

  it('long mode repeats only after 32767 steps', () => {
    const noise = lfsrNoise(32767 + 200);
    for (let i = 0; i < 200; i++) expect(noise[i + 32767]).toBe(noise[i]);
    expect([...noise.slice(0, 200)]).not.toEqual([...noise.slice(127, 327)]);
  });

  it('short mode repeats every 127 steps (the metallic Game Boy buzz)', () => {
    const noise = lfsrNoise(600, true);
    for (let i = 0; i < 300; i++) expect(noise[i + 127]).toBe(noise[i]);
  });

  it('is deterministic', () => {
    expect([...lfsrNoise(64)]).toEqual([...lfsrNoise(64)]);
  });
});
