/**
 * Formas de onda no espirito do Game Boy: pulso com ciclo de trabalho de 12,5%, 25% ou 50%
 * e ruido de um registrador de deslocamento (LFSR) de 15 bits.
 */

/**
 * Coeficientes de Fourier de uma onda de pulso, no formato de createPeriodicWave.
 * Um pulso centrado na origem e uma funcao par: so tem cossenos, a_n = 2 sen(n pi d) / (n pi).
 */
export function pulseWave(duty: number, harmonics = 32): { real: Float32Array; imag: Float32Array } {
  const real = new Float32Array(harmonics + 1);
  const imag = new Float32Array(harmonics + 1);
  for (let n = 1; n <= harmonics; n++) real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
  return { real, imag };
}

/**
 * Ruido do canal 4 do Game Boy: a cada passo o XOR dos dois bits mais baixos entra no bit 14.
 * No modo curto ele tambem entra no bit 6, e o ruido vira um zumbido metalico (periodo 127).
 */
export function lfsrNoise(length: number, short = false): Float32Array {
  const out = new Float32Array(length);
  let reg = 0x7fff;
  for (let i = 0; i < length; i++) {
    const bit = (reg ^ (reg >> 1)) & 1;
    reg = (reg >> 1) | (bit << 14);
    if (short) reg = (reg & ~0x40) | (bit << 6);
    out[i] = reg & 1 ? -1 : 1;
  }
  return out;
}
