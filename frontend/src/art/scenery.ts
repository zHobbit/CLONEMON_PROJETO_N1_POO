import { C, RAMPS } from './palette';
import { PixelCanvas, ellipse, union } from './raster';

/** Faixas de cor com uma linha de xadrez na transicao, como ceus de GBA. */
function bands(c: PixelCanvas, y0: number, stops: readonly [number, number][]): void {
  // stops: [cor, altura]
  let y = y0;
  stops.forEach(([color, height], i) => {
    for (let row = 0; row < height; row++, y++) {
      const next = stops[i + 1]?.[0];
      for (let x = 0; x < c.width; x++) {
        const dither = next !== undefined && row === height - 1 && (x + y) % 2 === 0;
        c.set(x, y, dither ? next : color);
      }
    }
  });
}

function cloud(c: PixelCanvas, cx: number, cy: number, w: number): void {
  const shape = union(
    ellipse(cx, cy, w / 2, 4),
    ellipse(cx - w / 5, cy - 3, w / 4, 4),
    ellipse(cx + w / 6, cy - 4, w / 4.5, 4.5),
  );
  c.paint(shape, { tones: [C.white, C.white, C.silver], outline: C.silver });
}

/** Grama com tufinhos, usada nas plataformas. */
function platform(c: PixelCanvas, cx: number, cy: number, rx: number, ry: number): void {
  c.paint(ellipse(cx, cy + 3, rx, ry), { tones: [C.forest], outline: C.pine }, { flat: 0 });
  c.paint(ellipse(cx, cy, rx - 2, ry - 2), { tones: [C.green, C.green, C.forest], outline: C.forest });
  for (let i = -3; i <= 3; i++) {
    const x = Math.round(cx + i * rx * 0.25);
    const y = Math.round(cy + ((i * 7) % 3) - 1);
    c.set(x, y, C.forest);
    c.set(x + 1, y - 1, C.forest);
  }
}

export const BATTLE_BG = { width: 240, height: 112, enemy: { x: 176, y: 62 }, player: { x: 60, y: 106 } } as const;

/** Fundo da batalha (acima da caixa de texto): ceu, nuvens, morros e as duas plataformas. */
export function drawBattleBackground(): PixelCanvas {
  const { width, height, enemy, player } = BATTLE_BG;
  const c = new PixelCanvas(width, height);
  bands(c, 0, [[C.blue, 12], [C.cyan, 24], [C.white, 28]]);
  cloud(c, 40, 22, 28);
  cloud(c, 128, 14, 22);
  cloud(c, 210, 30, 18);
  // Morros ao fundo.
  c.paint(union(ellipse(30, 70, 60, 18), ellipse(120, 74, 70, 16), ellipse(210, 68, 55, 20)), RAMPS.leaf, {
    form: { cx: 120, cy: 60, rx: 160, ry: 30 },
  });
  bands(c, 64, [[C.green, 6], [C.forest, height - 70]]);
  platform(c, enemy.x, enemy.y, 46, 10);
  platform(c, player.x, player.y, 56, 12);
  return c;
}

/** Ladrilho 16x16 discreto para o fundo dos menus. */
export function drawMenuTile(): PixelCanvas {
  const c = new PixelCanvas(16, 16);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) c.set(x, y, (x + y) % 8 < 2 ? C.silver : C.white);
  return c;
}

/** Ceu noturno do titulo, com estrelas fixas (sem aleatoriedade). */
export function drawTitleBackground(): PixelCanvas {
  const c = new PixelCanvas(240, 160);
  bands(c, 0, [[C.black, 40], [C.night, 50], [C.ink, 40], [C.forest, 4], [C.pine, 26]]);
  for (let i = 0; i < 40; i++) {
    const x = (i * 97 + 13) % 240;
    const y = (i * 53 + 7) % 110;
    c.set(x, y, i % 5 === 0 ? C.yellow : C.silver);
  }
  return c;
}
