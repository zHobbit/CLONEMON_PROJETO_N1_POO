// Monta uma folha de conferencia com todos os sprites finais ampliados: art-src/preview-monsters.png.
import { readdir } from 'node:fs/promises';
import sharp from 'sharp';

const DIR = 'src/assets/monsters';
const ZOOM = 4;
const CELL = 48 * ZOOM;
const COLUMNS = 6;
const files = (await readdir(DIR)).filter((f) => f.endsWith('.png') && !f.endsWith('-icon.png')).sort();
const cells = await Promise.all(
  files.map(async (file, i) => ({
    input: await sharp(`${DIR}/${file}`).resize(CELL, CELL, { kernel: 'nearest' }).png().toBuffer(),
    left: (i % COLUMNS) * CELL,
    top: Math.floor(i / COLUMNS) * CELL,
  })),
);
await sharp({ create: { width: COLUMNS * CELL, height: Math.ceil(files.length / COLUMNS) * CELL, channels: 3, background: '#63c74d' } })
  .composite(cells)
  .png()
  .toFile('art-src/preview-monsters.png');
console.log(`${files.length} sprites em art-src/preview-monsters.png`);
