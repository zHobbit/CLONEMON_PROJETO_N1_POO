// Converte a arte gerada em alta resolucao (art-src/) para os PNGs do jogo (src/assets/):
// reduz para a grade de pixels, limita as cores a paleta ENDESGA 32 e, nos sprites, recorta o fundo.
//
//   node scripts/pixelize.mjs            processa tudo o que esta em MANIFEST
//   node scripts/pixelize.mjs lucifer    so as entradas cujo nome contem "lucifer"
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(ROOT, 'art-src');
const OUT = resolve(ROOT, 'src/assets');

// Mesma lista de src/art/palette.ts.
const PALETTE = [
  0xbe4a2f, 0xd77643, 0xead4aa, 0xe4a672, 0xb86f50, 0x733e39, 0x3e2731, 0xa22633,
  0xe43b44, 0xf77622, 0xfeae34, 0xfee761, 0x63c74d, 0x3e8948, 0x265c42, 0x193c3e,
  0x124e89, 0x0099db, 0x2ce8f5, 0xffffff, 0xc0cbdc, 0x8b9bb4, 0x5a6988, 0x3a4466,
  0x262b44, 0x181425, 0xff0044, 0x68386c, 0xb55088, 0xf6757a, 0xe8b796, 0xc28569,
].map((hex) => [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff]);

const SPRITE = 48;
/** Icone do monstro nas listas do time: o mesmo desenho de frente, bem menor. */
const ICON = 16;
const ICON_PAD = 1;
/** Margem em volta do monstro dentro do quadro de 48x48. */
const SPRITE_PAD = 2;
const OUTLINE = [0x18, 0x14, 0x25];

/**
 * A mesma imagem do Lucifer com o fundo original. O recorte pronto perdeu a chama e o recorte
 * daqui perde os pes; somando os dois (opcao 'union') o desenho fica inteiro.
 */
const LUCIFER_GLOW = 'monsters/lucifer-front-glow.png';

/** Monstros cuja arte veio numa folha so: frente na metade esquerda, costas na direita. */
const SHEETS = ['lindoya', 'coiso', 'olaf', 'groot', 'eletropaulo', 'boto', 'paodeacucar', 'pimentinha', 'pinguim', 'abacaxi', 'gatonet'];

/**
 * kind 'sprite': 48x48 com fundo transparente ('side' escolhe a metade de uma folha frente/costas;
 * 'size' e 'pad' trocam o tamanho do quadro, usado nos icones).
 * kind 'scene': tamanho fixo, opaco.
 */
const MANIFEST = [
  { kind: 'sprite', src: 'monsters/lucifer-front.png', out: 'monsters/lucifer-front.png', union: LUCIFER_GLOW },
  { kind: 'sprite', src: 'monsters/lucifer-back.png', out: 'monsters/lucifer-back.png' },
  { kind: 'sprite', src: 'monsters/lucifer-front.png', out: 'monsters/lucifer-icon.png', size: ICON, pad: ICON_PAD, union: LUCIFER_GLOW },
  ...SHEETS.flatMap((name) => [
    { kind: 'sprite', src: `monsters/${name}.png`, out: `monsters/${name}-front.png`, side: 'left' },
    { kind: 'sprite', src: `monsters/${name}.png`, out: `monsters/${name}-back.png`, side: 'right' },
    { kind: 'sprite', src: `monsters/${name}.png`, out: `monsters/${name}-icon.png`, side: 'left', size: ICON, pad: ICON_PAD },
  ]),
  ...['field', 'dusk', 'night', 'town'].map((name) => ({ kind: 'scene', src: `battle/${name}.png`, out: `battle/${name}.png`, width: 240, height: 112 })),
  { kind: 'scene', src: 'title.png', out: 'title.png', width: 240, height: 160 },
];

/** Cor da paleta mais proxima, com peso maior no verde (a que o olho mais distingue). */
function nearestIndex(r, g, b) {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < PALETTE.length; i++) {
    const [pr, pg, pb] = PALETTE[i];
    const dist = 2 * (r - pr) ** 2 + 4 * (g - pg) ** 2 + 3 * (b - pb) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** Quanto o pontilhado desloca a cor antes de escolher na paleta: recupera degrades que a paleta nao tem. */
const DITHER = 20;

/** Limita um cenario opaco a paleta, com pontilhado ordenado (o mesmo xadrez dos ceus feitos por codigo). */
function quantizeScene(data, width) {
  for (let i = 0; i < data.length; i += 4) {
    const p = i / 4;
    const x = p % width;
    const y = (p - x) / width;
    const shift = (BAYER[(y % 4) * 4 + (x % 4)] / 15 - 0.5) * DITHER;
    const [r, g, b] = PALETTE[nearestIndex(data[i] + shift, data[i + 1] + shift, data[i + 2] + shift)];
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
}

/** Peso extra das cores escuras na votacao: tracos finos (olhos, boca) sobrevivem a reducao. */
const DARK_WEIGHT = 1.25;
/** Brilhos pequenos (olho, dente) tambem somem facil; ganham um pouco mais de peso. */
const ACCENT_WEIGHT = 1.6;
const ACCENT = new Set([11, 19]);
const DARK = new Set([5, 6, 15, 23, 24, 25, 27]);

/**
 * Reduz por votacao: cada pixel final recebe a cor da paleta mais comum no bloco de origem.
 * Diferente de uma media, nao cria cores intermediarias nem borra o contorno.
 */
function downsample(src, srcW, srcH, outW, outH, darkWeight = DARK_WEIGHT) {
  const out = new Uint8ClampedArray(outW * outH * 4);
  const votes = new Float32Array(PALETTE.length);
  for (let oy = 0; oy < outH; oy++) {
    for (let ox = 0; ox < outW; ox++) {
      const x0 = Math.floor((ox * srcW) / outW);
      const x1 = Math.max(x0 + 1, Math.floor(((ox + 1) * srcW) / outW));
      const y0 = Math.floor((oy * srcH) / outH);
      const y1 = Math.max(y0 + 1, Math.floor(((oy + 1) * srcH) / outH));
      votes.fill(0);
      let solid = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * srcW + x) * 4;
          if (src[i + 3] < 128) continue;
          solid++;
          const index = nearestIndex(src[i], src[i + 1], src[i + 2]);
          votes[index] += DARK.has(index) ? darkWeight : ACCENT.has(index) ? ACCENT_WEIGHT : 1;
        }
      }
      if (solid * 2 < (x1 - x0) * (y1 - y0)) continue;
      let best = 0;
      for (let k = 1; k < votes.length; k++) if (votes[k] > votes[best]) best = k;
      out.set([...PALETTE[best], 255], (oy * outW + ox) * 4);
    }
  }
  return out;
}

/** Ilhas com menos pixels que isto sao sujeira da reducao, nao parte do monstro. */
const MIN_ISLAND = 12;

/** Remove ilhas pequenas de pixels opacos (ligadas so entre si), comuns na borda depois da reducao. */
function despeckle(data, width, height) {
  const seen = new Uint8Array(width * height);
  for (let start = 0; start < width * height; start++) {
    if (seen[start] || data[start * 4 + 3] === 0) continue;
    const island = [start];
    seen[start] = 1;
    for (let k = 0; k < island.length; k++) {
      const x = island[k] % width;
      const y = (island[k] - x) / width;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const n = ny * width + nx;
        if (seen[n] || data[n * 4 + 3] === 0) continue;
        seen[n] = 1;
        island.push(n);
      }
    }
    if (island.length < MIN_ISLAND) for (const p of island) data[p * 4 + 3] = 0;
  }
}

/** Fecha o contorno: todo pixel opaco na borda da silhueta vira a cor de contorno. */
function outline(data, width, height) {
  const solid = (x, y) => x >= 0 && y >= 0 && x < width && y < height && data[(y * width + x) * 4 + 3] > 0;
  const edge = [];
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (solid(x, y) && !(solid(x - 1, y) && solid(x + 1, y) && solid(x, y - 1) && solid(x, y + 1))) edge.push((y * width + x) * 4);
  for (const i of edge) [data[i], data[i + 1], data[i + 2]] = OUTLINE;
}

/** Distancia maxima (por canal) da cor do canto para um pixel contar como fundo liso. */
const KEY_TOLERANCE = 90;
/** Abaixo deste brilho no canto, o fundo e tratado como escuro (com brilho em volta do desenho). */
const DARK_BACKDROP = 80;
/** Fundo escuro: salto maximo (por canal) entre vizinhos para o preenchimento continuar. */
const SMOOTH_STEP = 14;
/** Fundo escuro: nenhum pixel mais claro que isto e fundo. */
const BACKDROP_CEILING = 150;

/**
 * Apaga o fundo com um preenchimento que parte das bordas, entao areas da mesma cor dentro do
 * monstro ficam intactas. Dois modos, conforme a cor do canto:
 * - fundo liso (verde, magenta): avanca enquanto a cor for parecida com a do canto;
 * - fundo escuro com brilho: avanca enquanto a cor mudar aos poucos. O degrade do brilho e suave,
 *   e a borda do desenho e um salto brusco, que segura o preenchimento. Se o contorno preto for
 *   comido em algum trecho, outline() o refaz depois.
 */
/** Recorte pronto: abaixo disto e fundo. Baixo de proposito, porque chamas e brilhos vem quase transparentes. */
const PRECUT_ALPHA = 60;

function keyOut(data, width, height) {
  // Canto ja transparente: o fundo foi removido antes (ferramenta de recorte). So falta tirar a
  // borda semitransparente que esse recorte deixa, que viraria um halo escuro na reducao.
  if (data[3] < 128) {
    for (let i = 3; i < data.length; i += 4) data[i] = data[i] < PRECUT_ALPHA ? 0 : 255;
    return;
  }
  const [kr, kg, kb] = [data[0], data[1], data[2]];
  const dark = Math.max(kr, kg, kb) < DARK_BACKDROP;
  const near = (p, r, g, b, limit) =>
    Math.abs(data[p * 4] - r) < limit && Math.abs(data[p * 4 + 1] - g) < limit && Math.abs(data[p * 4 + 2] - b) < limit;
  const accepts = dark
    ? (p, from) =>
        Math.max(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]) < BACKDROP_CEILING &&
        (from < 0 || near(p, data[from * 4], data[from * 4 + 1], data[from * 4 + 2], SMOOTH_STEP))
    : (p) => near(p, kr, kg, kb, KEY_TOLERANCE);
  const seen = new Uint8Array(width * height);
  const stack = [];
  const push = (x, y, from) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (seen[p] || !accepts(p, from)) return;
    seen[p] = 1;
    stack.push(p);
  };
  for (let x = 0; x < width; x++) push(x, 0, -1), push(x, height - 1, -1);
  for (let y = 0; y < height; y++) push(0, y, -1), push(width - 1, y, -1);
  while (stack.length > 0) {
    const p = stack.pop();
    const x = p % width;
    const y = (p - x) / width;
    push(x - 1, y, p), push(x + 1, y, p), push(x, y - 1, p), push(x, y + 1, p);
  }
  // So apaga no fim: o modo escuro compara com a cor original dos vizinhos.
  const backdrop = dark ? thickOnly(seen, width, height) : seen;
  for (let p = 0; p < backdrop.length; p++) if (backdrop[p]) data[p * 4 + 3] = 0;
  if (!dark) clearPockets(data, width, height, (p) => near(p, kr, kg, kb, POCKET_TOLERANCE));
}

/** Bolsoes de fundo fechados pelo desenho (entre o braco e o corpo) usam uma tolerancia mais justa. */
const POCKET_TOLERANCE = 40;
/** Menor que isto nao e bolsao: pode ser o brilho de um olho da cor do fundo. */
const POCKET_MIN = 350;

/** Apaga areas da cor do fundo que o preenchimento nao alcancou por estarem cercadas pelo desenho. */
function clearPockets(data, width, height, isKey) {
  const seen = new Uint8Array(width * height);
  for (let start = 0; start < width * height; start++) {
    if (seen[start] || data[start * 4 + 3] === 0 || !isKey(start)) continue;
    const pocket = [start];
    seen[start] = 1;
    for (let k = 0; k < pocket.length; k++) {
      const x = pocket[k] % width;
      const y = (pocket[k] - x) / width;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const n = ny * width + nx;
        if (seen[n] || data[n * 4 + 3] === 0 || !isKey(n)) continue;
        seen[n] = 1;
        pocket.push(n);
      }
    }
    if (pocket.length >= POCKET_MIN) for (const p of pocket) data[p * 4 + 3] = 0;
  }
}

/** Metade da largura minima (em pixels da imagem gerada) de uma area para ela contar como fundo. */
const BACKDROP_RADIUS = 6;

/**
 * No fundo escuro o preenchimento as vezes entra pelo contorno preto e vaza para as sombras do
 * desenho. O contorno e fino e o fundo e largo: isto descarta tudo o que so se liga a borda da
 * imagem por passagens mais finas que BACKDROP_RADIUS.
 */
function thickOnly(mask, width, height) {
  const r = BACKDROP_RADIUS;
  // Tabela de somas: conta em tempo constante quantos pixels de um quadrado estao marcados.
  const sums = (m) => {
    const t = new Uint32Array((width + 1) * (height + 1));
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        t[(y + 1) * (width + 1) + x + 1] = m[y * width + x] + t[y * (width + 1) + x + 1] + t[(y + 1) * (width + 1) + x] - t[y * (width + 1) + x];
    return (x, y) => {
      const x0 = Math.max(0, x - r);
      const y0 = Math.max(0, y - r);
      const x1 = Math.min(width, x + r + 1);
      const y1 = Math.min(height, y + r + 1);
      const count = t[y1 * (width + 1) + x1] - t[y0 * (width + 1) + x1] - t[y1 * (width + 1) + x0] + t[y0 * (width + 1) + x0];
      return { count, area: (x1 - x0) * (y1 - y0) };
    };
  };
  const around = sums(mask);
  const eroded = new Uint8Array(width * height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const { count, area } = around(x, y);
      eroded[y * width + x] = count === area ? 1 : 0;
    }
  // Do que sobrou, so o que ainda alcanca a borda da imagem.
  const core = new Uint8Array(width * height);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (core[p] || !eroded[p]) return;
    core[p] = 1;
    stack.push(p);
  };
  for (let x = 0; x < width; x++) push(x, 0), push(x, height - 1);
  for (let y = 0; y < height; y++) push(0, y), push(width - 1, y);
  while (stack.length > 0) {
    const p = stack.pop();
    const x = p % width;
    const y = (p - x) / width;
    push(x - 1, y), push(x + 1, y), push(x, y - 1), push(x, y + 1);
  }
  // Devolve a faixa que a erosao tirou, sem passar do que o preenchimento tinha marcado.
  const nearCore = sums(core);
  const out = new Uint8Array(width * height);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) out[y * width + x] = mask[y * width + x] && nearCore(x, y).count > 0 ? 1 : 0;
  return out;
}

/**
 * Coluna que separa os dois desenhos de uma folha: o meio da maior faixa vazia no terco central.
 * Mais seguro que cortar na metade exata, porque a geracao nem sempre centraliza os dois.
 */
function splitColumn(data, width, height) {
  let best = { start: Math.floor(width / 2), length: 0 };
  let run = 0;
  for (let x = Math.floor(width / 3); x < Math.ceil((width * 2) / 3); x++) {
    let empty = true;
    for (let y = 0; y < height && empty; y++) empty = data[(y * width + x) * 4 + 3] === 0;
    run = empty ? run + 1 : 0;
    if (run > best.length) best = { start: x - run + 1, length: run };
  }
  return best.start + Math.floor(best.length / 2);
}

/** Apaga uma das metades da folha, deixando so o desenho pedido. */
function keepSide(data, width, height, side) {
  const split = splitColumn(data, width, height);
  const [from, to] = side === 'left' ? [split, width] : [0, split];
  for (let y = 0; y < height; y++) for (let x = from; x < to; x++) data[(y * width + x) * 4 + 3] = 0;
}

/** Icone: so as bordas muito claras ganham um cinza, para o branco nao sumir no fundo claro dos menus. */
function shadeLightEdges(data, width, height) {
  const solid = (x, y) => x >= 0 && y >= 0 && x < width && y < height && data[(y * width + x) * 4 + 3] > 0;
  const edge = [];
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const light = Math.min(data[i], data[i + 1], data[i + 2]) > 180;
      if (solid(x, y) && light && !(solid(x - 1, y) && solid(x + 1, y) && solid(x, y - 1) && solid(x, y + 1))) edge.push(i);
    }
  for (const i of edge) [data[i], data[i + 1], data[i + 2]] = [0x8b, 0x9b, 0xb4];
}

async function sprite(entry) {
  const size = entry.size ?? SPRITE;
  const pad = entry.pad ?? SPRITE_PAD;
  const inner = size - pad * 2;
  const full = await sharp(resolve(SRC, entry.src)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  keyOut(full.data, full.info.width, full.info.height);
  if (entry.union) {
    // Outro recorte da mesma imagem: o que ele manteve e este apagou volta.
    const other = await sharp(resolve(SRC, entry.union)).ensureAlpha().raw().toBuffer();
    keyOut(other, full.info.width, full.info.height);
    for (let i = 0; i < other.length; i += 4) if (full.data[i + 3] === 0 && other[i + 3] > 0) full.data.set(other.subarray(i, i + 4), i);
  }
  if (entry.side) keepSide(full.data, full.info.width, full.info.height, entry.side);
  // Recorta a area usada, encaixa no quadro e apoia o monstro na base (os pes ficam na mesma linha).
  const trimmed = await sharp(full.data, { raw: { width: full.info.width, height: full.info.height, channels: 4 } })
    .trim({ threshold: 10 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const ratio = Math.min(inner / trimmed.info.width, inner / trimmed.info.height);
  const width = Math.max(1, Math.round(trimmed.info.width * ratio));
  const height = Math.max(1, Math.round(trimmed.info.height * ratio));
  // No icone cada pixel vale muito: sem reforco de escuro nem contorno fechado, senao vira um borrao preto.
  const icon = size !== SPRITE;
  const small = { data: downsample(trimmed.data, trimmed.info.width, trimmed.info.height, width, height, icon ? 0.6 : DARK_WEIGHT) };
  // No icone uma ilha pequena pode ser um braco inteiro, entao so o sprite grande e limpo.
  if (size === SPRITE) despeckle(small.data, width, height);
  if (icon) shadeLightEdges(small.data, width, height);
  else outline(small.data, width, height);
  const left = Math.floor((size - width) / 2);
  const top = size - pad - height;
  return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: Buffer.from(small.data.buffer), raw: { width, height, channels: 4 }, left, top }])
    .png();
}

async function scene(entry) {
  const { data, info } = await sharp(resolve(SRC, entry.src))
    .removeAlpha()
    .resize(entry.width, entry.height, { fit: 'cover', position: entry.position ?? 'centre', kernel: 'lanczos3' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  quantizeScene(data, info.width);
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).removeAlpha().png();
}

const filter = process.argv[2];
for (const entry of MANIFEST) {
  if (filter && !entry.out.includes(filter)) continue;
  if (!existsSync(resolve(SRC, entry.src))) {
    console.log(`falta  ${entry.src}`);
    continue;
  }
  const target = resolve(OUT, entry.out);
  await mkdir(dirname(target), { recursive: true });
  const image = entry.kind === 'sprite' ? await sprite(entry) : await scene(entry);
  await image.toFile(target);
  console.log(`${entry.kind.padEnd(6)} ${entry.out}`);
}
