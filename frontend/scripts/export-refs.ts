// Exporta os sprites feitos por codigo como folhas de referencia (frente a esquerda, costas a direita)
// para servir de entrada na geracao da arte nova. Precisa de um empacotador para rodar:
//   npx esbuild scripts/export-refs.ts --bundle --platform=node --format=esm --external:sharp --outfile=node_modules/.cache/export-refs.mjs
//   node node_modules/.cache/export-refs.mjs
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import type { Element } from '../src/api/types';
import { SPRITE_SIZE, drawMonster } from '../src/art/monsters';

const SPECIES: [string, Element][] = [
  ['Lindoya', 'AGUA'], ['Coiso', 'ROCHA'], ['Lucifer', 'FOGO'], ['Olaf', 'GELO'], ['Groot', 'GRAMA'], ['EletroPaulo', 'RAIO'],
  ['Boto', 'AGUA'], ['PaoDeAcucar', 'ROCHA'], ['Pimentinha', 'FOGO'], ['Pinguim', 'GELO'], ['Abacaxi', 'GRAMA'], ['Gatonet', 'RAIO'],
];
const ZOOM = 16;
const CELL = SPRITE_SIZE * ZOOM;

async function cell(name: string, element: Element, view: 'front' | 'back'): Promise<Buffer> {
  const rgba = Buffer.from(drawMonster(name, element, view, 0).rgba());
  return sharp(rgba, { raw: { width: SPRITE_SIZE, height: SPRITE_SIZE, channels: 4 } }).resize(CELL, CELL, { kernel: 'nearest' }).png().toBuffer();
}

await mkdir('art-src/ref', { recursive: true });
for (const [name, element] of SPECIES) {
  await sharp({ create: { width: CELL * 2, height: CELL, channels: 3, background: '#ffffff' } })
    .composite([
      { input: await cell(name, element, 'front'), left: 0, top: 0 },
      { input: await cell(name, element, 'back'), left: CELL, top: 0 },
    ])
    .png()
    .toFile(`art-src/ref/${name.toLowerCase()}-sheet.png`);
}
console.log(`${SPECIES.length} folhas em art-src/ref`);
