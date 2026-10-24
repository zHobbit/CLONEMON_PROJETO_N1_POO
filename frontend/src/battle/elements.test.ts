import { describe, expect, it } from 'vitest';
import { effectiveness } from './elements';

describe('effectiveness', () => {
  it('follows the cycle AGUA > ROCHA > FOGO > GELO > GRAMA > RAIO > AGUA', () => {
    expect(effectiveness('AGUA', 'ROCHA')).toBe(2);
    expect(effectiveness('ROCHA', 'FOGO')).toBe(2);
    expect(effectiveness('FOGO', 'GELO')).toBe(2);
    expect(effectiveness('GELO', 'GRAMA')).toBe(2);
    expect(effectiveness('GRAMA', 'RAIO')).toBe(2);
    expect(effectiveness('RAIO', 'AGUA')).toBe(2);
  });

  it('is halved against the previous element and neutral otherwise', () => {
    expect(effectiveness('ROCHA', 'AGUA')).toBe(0.5);
    expect(effectiveness('AGUA', 'RAIO')).toBe(0.5);
    expect(effectiveness('AGUA', 'FOGO')).toBe(1);
    expect(effectiveness('AGUA', 'AGUA')).toBe(1);
  });
});
