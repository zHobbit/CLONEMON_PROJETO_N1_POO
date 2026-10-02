import { CHARS, type Ramp, toRgb } from './palette';

/**
 * Formas sao funcoes (x, y) -> dentro/fora, testadas no centro de cada pixel.
 * As coordenadas sao do espaco do desenho (48x48 para os monstros).
 */
export type Mask = (x: number, y: number) => boolean;

const center = (v: number) => v + 0.5;

export const ellipse = (cx: number, cy: number, rx: number, ry: number): Mask => (x, y) =>
  ((center(x) - cx) / rx) ** 2 + ((center(y) - cy) / ry) ** 2 <= 1;

/** Entre retangulo e elipse: n=2 e elipse, n alto vira retangulo de cantos arredondados. */
export const superellipse = (cx: number, cy: number, rx: number, ry: number, n = 4): Mask => (x, y) =>
  Math.abs((center(x) - cx) / rx) ** n + Math.abs((center(y) - cy) / ry) ** n <= 1;

export const rect = (x0: number, y0: number, w: number, h: number): Mask => (x, y) =>
  x >= x0 && x < x0 + w && y >= y0 && y < y0 + h;

export type Point = readonly [number, number];

export const poly = (points: readonly Point[]): Mask => (x, y) => {
  const px = center(x);
  const py = center(y);
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

/** Segmento com espessura (raio r), bom para galhos, rabos e cabos. */
export const line = (x0: number, y0: number, x1: number, y1: number, r: number): Mask => (x, y) => {
  const px = center(x);
  const py = center(y);
  const dx = x1 - x0;
  const dy = y1 - y0;
  const t = Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy)) <= r;
};

export const union = (...masks: Mask[]): Mask => (x, y) => masks.some((m) => m(x, y));
export const minus = (a: Mask, b: Mask): Mask => (x, y) => a(x, y) && !b(x, y);
export const intersect = (a: Mask, b: Mask): Mask => (x, y) => a(x, y) && b(x, y);
export const shift = (m: Mask, dx: number, dy: number): Mask => (x, y) => m(x - dx, y - dy);
/** Espelha no eixo vertical do desenho, unindo com o original. */
export const mirror = (m: Mask, width: number): Mask => (x, y) => m(x, y) || m(width - 1 - x, y);

export interface Form {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export interface PaintOptions {
  /** Volume usado para estimar a iluminacao; padrao: a caixa que envolve a forma. */
  form?: Form;
  /** Desenha o contorno nas bordas da forma (padrao: sim). */
  outline?: boolean;
  /** Pinta tudo com um unico tom da rampa, sem sombreamento. */
  flat?: number;
}

/** Luz vindo de cima e da esquerda, um pouco de frente. */
const LIGHT = (() => {
  const v = [-0.5, -0.75, 0.6];
  const len = Math.hypot(...v);
  return v.map((c) => c / len);
})();

const THRESHOLDS: Record<number, number[]> = {
  1: [],
  2: [0.15],
  3: [0.62, 0.05],
  4: [0.8, 0.38, -0.15],
};
const DITHER_BAND = 0.008;

/** Escolhe o tom da rampa pela luz que chega na "superficie" do ponto (nx, ny) da forma. */
export function toneFor(nx: number, ny: number, tones: number, x: number, y: number, dither = true): number {
  const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
  const light = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
  const thresholds = THRESHOLDS[tones] ?? THRESHOLDS[4];
  let tone = thresholds.findIndex((t) => light > t);
  if (tone < 0) tone = thresholds.length;
  // Xadrez so numa faixa bem estreita entre dois tons, para suavizar sem sujar.
  const t = thresholds[tone - 1];
  if (dither && t !== undefined && light - t < DITHER_BAND && (x + y) % 2 === 0) tone -= 1;
  return Math.min(tone, tones - 1);
}

/** Tela de pixels indexados na paleta (-1 = transparente). */
export class PixelCanvas {
  readonly px: Int16Array;

  /**
   * @param scale quantos pixels do espaco do desenho cabem em um pixel da tela;
   *              3 desenha a mesma forma 48x48 como um icone 16x16.
   */
  constructor(
    readonly width: number,
    readonly height: number,
    readonly scale = 1,
  ) {
    this.px = new Int16Array(width * height).fill(-1);
  }

  get(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return -1;
    return this.px[y * this.width + x];
  }

  set(x: number, y: number, color: number): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    this.px[y * this.width + x] = color;
  }

  /** Coordenada no espaco do desenho do centro do pixel (x, y) da tela. */
  private source(v: number): number {
    return v * this.scale + (this.scale - 1) / 2;
  }

  private sample(mask: Mask, x: number, y: number): boolean {
    return mask(this.source(x), this.source(y));
  }

  paint(mask: Mask, ramp: Ramp, opts: PaintOptions = {}): this {
    const inside: boolean[] = [];
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const hit = this.sample(mask, x, y);
        inside[y * this.width + x] = hit;
        if (hit) {
          x0 = Math.min(x0, x); x1 = Math.max(x1, x);
          y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        }
      }
    }
    if (x0 === Infinity) return this;

    const form = opts.form ?? {
      cx: this.source((x0 + x1) / 2) + 0.5,
      cy: this.source((y0 + y1) / 2) + 0.5,
      rx: ((x1 - x0 + 1) * this.scale) / 2,
      ry: ((y1 - y0 + 1) * this.scale) / 2,
    };
    const isIn = (x: number, y: number) =>
      x >= 0 && y >= 0 && x < this.width && y < this.height && inside[y * this.width + x];

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (!isIn(x, y)) continue;
        if (opts.outline !== false) {
          const lit = !isIn(x, y - 1) || !isIn(x - 1, y);
          const dark = !isIn(x, y + 1) || !isIn(x + 1, y);
          // Contorno seletivo: do lado da luz usa o tom mais escuro da rampa, do outro a cor de contorno.
          if (dark) { this.set(x, y, ramp.outline); continue; }
          if (lit) { this.set(x, y, ramp.tones[ramp.tones.length - 1]); continue; }
        }
        if (opts.flat !== undefined) {
          this.set(x, y, ramp.tones[opts.flat]);
          continue;
        }
        const nx = (this.source(x) + 0.5 - form.cx) / form.rx;
        const ny = (this.source(y) + 0.5 - form.cy) / form.ry;
        // Em icones (escala > 1) o pontilhado vira ruido.
        this.set(x, y, ramp.tones[toneFor(nx, ny, ramp.tones.length, x, y, this.scale === 1)]);
      }
    }
    return this;
  }

  /** Pinta uma cor solida (sem rampa), ex.: sombras e brilhos. */
  fill(mask: Mask, color: number): this {
    for (let y = 0; y < this.height; y++)
      for (let x = 0; x < this.width; x++) if (this.sample(mask, x, y)) this.set(x, y, color);
    return this;
  }

  /** Carimba uma grade desenhada a mao (ver CHARS). Com mirror, carimba tambem a copia espelhada. */
  stamp(grid: readonly string[], x: number, y: number, opts: { mirror?: boolean } = {}): this {
    const w = grid[0]?.length ?? 0;
    const put = (gx: number, gy: number, ch: string) => {
      if (ch === '.' || ch === ' ') return;
      const color = CHARS[ch];
      if (color === undefined) throw new Error(`Unknown pixel char '${ch}'`);
      this.set(gx, gy, color);
    };
    grid.forEach((row, gy) => {
      for (let gx = 0; gx < row.length; gx++) {
        put(x + gx, y + gy, row[gx]);
        if (opts.mirror) put(this.width - x - w + (w - 1 - gx), y + gy, row[gx]);
      }
    });
    return this;
  }

  /** Caixa dos pixels visiveis, ou null se estiver vazio. */
  bounds(): { x0: number; y0: number; x1: number; y1: number } | null {
    let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
    for (let y = 0; y < this.height; y++)
      for (let x = 0; x < this.width; x++)
        if (this.get(x, y) >= 0) {
          x0 = Math.min(x0, x); x1 = Math.max(x1, x);
          y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        }
    return x1 < 0 ? null : { x0, y0, x1, y1 };
  }

  rgba(): Uint8ClampedArray {
    const out = new Uint8ClampedArray(this.width * this.height * 4);
    this.px.forEach((color, i) => {
      if (color < 0) return;
      const [r, g, b] = toRgb(color);
      out.set([r, g, b, 255], i * 4);
    });
    return out;
  }
}

/** Junta quadros lado a lado (folha de sprites horizontal). */
export function sheet(frames: readonly PixelCanvas[]): { width: number; height: number; rgba: Uint8ClampedArray } {
  const w = frames[0].width;
  const h = frames[0].height;
  const out = new Uint8ClampedArray(w * frames.length * h * 4);
  frames.forEach((frame, f) => {
    const data = frame.rgba();
    for (let y = 0; y < h; y++) out.set(data.subarray(y * w * 4, (y + 1) * w * 4), (y * w * frames.length + f * w) * 4);
  });
  return { width: w * frames.length, height: h, rgba: out };
}
