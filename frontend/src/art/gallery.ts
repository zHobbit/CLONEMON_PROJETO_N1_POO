import type { Element } from '../api/types';
import { ELEMENT_ICON_SIZE, drawElementIcon } from './icons';
import { ICON_SIZE, SPRITE_SIZE, drawIcon, drawMonster } from './monsters';
import type { PixelCanvas } from './raster';
import { BATTLE_BG, drawBattleBackground, drawMenuTile, drawTitleBackground } from './scenery';
import { Tile, drawAllTiles, drawCenter, drawExclaim, drawHouse } from './world';
import { CHARACTER_IDS, DIRECTIONS, type CharacterId, type Direction, drawCharacterFrame } from './worldCharacters';

/** Pagina de desenvolvimento (/art.html): toda a arte ampliada, para revisao. */

type Entry = [string, Element];

const SPECIES: Entry[] = [
  ['Lindoya', 'AGUA'], ['Coiso', 'ROCHA'], ['Lucifer', 'FOGO'], ['Olaf', 'GELO'], ['Groot', 'GRAMA'], ['EletroPaulo', 'RAIO'],
  ['Boto', 'AGUA'], ['PaoDeAcucar', 'ROCHA'], ['Pimentinha', 'FOGO'], ['Pinguim', 'GELO'], ['Abacaxi', 'GRAMA'], ['Gatonet', 'RAIO'],
];
/** Duplas (inimigo de frente, jogador de costas) montadas na cena de batalha. */
const BATTLES: [Entry, Entry][] = [
  [['Lucifer', 'FOGO'], ['Olaf', 'GELO']],
  [['Gatonet', 'RAIO'], ['Boto', 'AGUA']],
  [['PaoDeAcucar', 'ROCHA'], ['Pimentinha', 'FOGO']],
  [['Abacaxi', 'GRAMA'], ['Pinguim', 'GELO']],
  [['Boto', 'AGUA'], ['Abacaxi', 'GRAMA']],
  [['Pinguim', 'GELO'], ['Gatonet', 'RAIO']],
  [['Pimentinha', 'FOGO'], ['PaoDeAcucar', 'ROCHA']],
];
const ZOOM = 4;
const CELL = SPRITE_SIZE * ZOOM + 8;
const LEFT = 110;
const COLUMNS = ['frente 0', 'frente 1', 'costas 0', 'costas 1', 'icone'];
const SCENE_ZOOM = 3;
const SCENE_W = BATTLE_BG.width * SCENE_ZOOM;
const SCENE_H = BATTLE_BG.height * SCENE_ZOOM;
const SCENE_ROW = SCENE_H + 32;
/** Secao do mapa de exploracao (rodape): ladrilhos, predios, personagens e um mapa montado. */
const WORLD_H = 1504;
const MAP_ZOOM = 3;

const canvas = document.getElementById('gallery') as HTMLCanvasElement;
canvas.width = Math.max(LEFT + CELL * COLUMNS.length + 60, 4 + (SCENE_W + 16) * 2);
const monstersHeight = 24 + CELL * SPECIES.length;
const battlesY = monstersHeight + 40;
const sceneY = battlesY + Math.ceil(BATTLES.length / 2) * SCENE_ROW + 8;
const worldY = sceneY + 320 + 48;
canvas.height = worldY + WORLD_H;
canvas.dataset.worldY = String(worldY);
const ctx = canvas.getContext('2d')!;
ctx.imageSmoothingEnabled = false;
ctx.font = '12px monospace';

function toCanvas(art: PixelCanvas): HTMLCanvasElement {
  const tmp = document.createElement('canvas');
  tmp.width = art.width;
  tmp.height = art.height;
  tmp.getContext('2d')!.putImageData(new ImageData(art.rgba() as Uint8ClampedArray<ArrayBuffer>, art.width, art.height), 0, 0);
  return tmp;
}

function blit(art: PixelCanvas, x: number, y: number, zoom: number): void {
  ctx.drawImage(toCanvas(art), x, y, art.width * zoom, art.height * zoom);
}

function label(text: string, x: number, y: number): void {
  ctx.fillStyle = '#fff';
  ctx.fillText(text, x, y);
}

COLUMNS.forEach((text, i) => label(text, LEFT + i * CELL, 14));
SPECIES.forEach(([name, element], row) => {
  const y = 24 + row * CELL;
  label(name, 4, y + CELL / 2);
  const frames = [
    drawMonster(name, element, 'front', 0), drawMonster(name, element, 'front', 1),
    drawMonster(name, element, 'back', 0), drawMonster(name, element, 'back', 1),
  ];
  frames.forEach((art, i) => {
    ctx.fillStyle = i % 2 === 0 ? '#c8e8f8' : '#f8f8f0';
    ctx.fillRect(LEFT + i * CELL, y, SPRITE_SIZE * ZOOM, SPRITE_SIZE * ZOOM);
    blit(art, LEFT + i * CELL, y, ZOOM);
  });
  ctx.fillStyle = '#f8f8f0';
  ctx.fillRect(LEFT + 4 * CELL, y, ICON_SIZE * ZOOM * 2, ICON_SIZE * ZOOM * 2);
  blit(drawIcon(name, element), LEFT + 4 * CELL, y, ZOOM * 2);
  ctx.fillRect(LEFT + 4 * CELL + 136, y, ELEMENT_ICON_SIZE * ZOOM, ELEMENT_ICON_SIZE * ZOOM);
  blit(drawElementIcon(element), LEFT + 4 * CELL + 136, y, ZOOM);
});

// Cenas de batalha montadas com os assets reais, no tamanho do jogo x3.
BATTLES.forEach(([[enemyName, enemyEl], [playerName, playerEl]], i) => {
  const x = 4 + (i % 2) * (SCENE_W + 16);
  const y = battlesY + Math.floor(i / 2) * SCENE_ROW;
  label(`batalha (x3): ${enemyName} x ${playerName}`, x, y - 8);
  const battle = toCanvas(drawBattleBackground());
  const bctx = battle.getContext('2d')!;
  bctx.drawImage(toCanvas(drawMonster(enemyName, enemyEl, 'front', 0)), BATTLE_BG.enemy.x - 24, BATTLE_BG.enemy.y - 44);
  bctx.drawImage(toCanvas(drawMonster(playerName, playerEl, 'back', 0)), BATTLE_BG.player.x - 24, BATTLE_BG.player.y - 44);
  ctx.drawImage(battle, x, y, SCENE_W, SCENE_H);
});

label('titulo (x2)', 4, sceneY - 8);
blit(drawTitleBackground(), 4, sceneY, 2);
const tileX = 4 + 480 + 32;
label('menu (x4)', tileX, sceneY - 8);
const tile = drawMenuTile();
for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) blit(tile, tileX + i * 64, sceneY + j * 64, ZOOM);

// ---------------------------------------------------------------- mapa de exploracao

const TILE_NAMES = ['grama', 'capim alto', 'caminho', 'agua', 'arvore', 'flores', 'cerca', 'placa', 'pedra', 'areia', 'ponte', 'capim frente'];
const worldTiles = drawAllTiles();
const sectionLabel = (text: string, y: number) => label(text, 4, y);

// Ladrilhos ampliados (x5), cada um em seu fundo xadrez para mostrar a transparencia.
sectionLabel('mundo: ladrilhos (x5), na ordem do enum Tile', worldY);
worldTiles.forEach((art, i) => {
  const x = 4 + i * 88;
  ctx.fillStyle = i % 2 === 0 ? '#ff00ff' : '#00ffff';
  ctx.fillRect(x, worldY + 8, 80, 80);
  blit(art, x, worldY + 8, 5);
  ctx.font = '9px monospace';
  label(TILE_NAMES[i], x, worldY + 100);
  ctx.font = '12px monospace';
});

// Emenda: a mesma peca repetida 3x3 nao pode mostrar costura.
sectionLabel('emenda 3x3 (x3)', worldY + 124);
[Tile.GRASS, Tile.TALL_GRASS, Tile.PATH, Tile.WATER, Tile.SAND, Tile.FLOWERS, Tile.BRIDGE, Tile.FENCE].forEach((id, k) => {
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) blit(worldTiles[id], 4 + k * 160 + i * 48, worldY + 132 + j * 48, 3);
});

// Predios e balao de exclamacao.
const buildingsY = worldY + 300;
sectionLabel('predios (x4) e balao (x6)', buildingsY);
const grassTile = worldTiles[Tile.GRASS];
ctx.save();
ctx.beginPath();
ctx.rect(4, buildingsY + 8, 320 + 24 + 256 + 24 + 96, 256);
ctx.clip();
for (let i = 0; i < 12; i++) for (let j = 0; j < 4; j++) blit(grassTile, 4 + i * 64, buildingsY + 8 + j * 64, 4);
ctx.restore();
blit(drawCenter(), 4, buildingsY + 8, 4);
blit(drawHouse(), 4 + 320 + 24, buildingsY + 8 + 64, 4);
ctx.fillStyle = '#6a8a4a';
ctx.fillRect(4 + 320 + 24 + 256 + 24, buildingsY + 8, 96, 96);
blit(drawExclaim(), 4 + 320 + 24 + 256 + 24, buildingsY + 8, 6);

// Personagens: 4 linhas (baixo, esquerda, direita, cima) x 3 colunas (parado, passo A, passo B).
const charsY = worldY + 584;
sectionLabel('personagens (x4): linhas baixo, esq, dir, cima; colunas parado, passo A, passo B', charsY - 8);
const CHAR_ZOOM = 4;
CHARACTER_IDS.forEach((id, k) => {
  const x0 = 4 + k * 208;
  label(id, x0, charsY + 8);
  DIRECTIONS.forEach((dir, row) =>
    ([0, 1, 2] as const).forEach((step) => {
      const x = x0 + step * 64;
      const y = charsY + 16 + row * 96;
      ctx.fillStyle = (step + row) % 2 === 0 ? '#63c74d' : '#5cbb47';
      ctx.fillRect(x, y, 64, 96);
      blit(drawCharacterFrame(id, dir, step), x, y, CHAR_ZOOM);
    }));
});
// Tamanho real (x1) e x2, para conferir a leitura.
const smallX = 4 + 4 * 208 + 24;
label('tamanho real (x1) e x2', smallX, charsY + 8);
CHARACTER_IDS.forEach((id, k) => {
  DIRECTIONS.forEach((dir, row) =>
    ([0, 1, 2] as const).forEach((step) => {
      const frame = drawCharacterFrame(id, dir, step);
      const x = smallX + (k % 2) * 330 + (row * 3 + step) * 17;
      const y = charsY + 16 + Math.floor(k / 2) * 150;
      ctx.fillStyle = '#63c74d';
      ctx.fillRect(x, y, 17, 25);
      blit(frame, x, y, 1);
      ctx.fillRect(x, y + 28, 34, 50);
      blit(frame, x, y + 28, 2);
    }));
});

// Mapa montado com os assets reais, no tamanho do jogo x3.
const MAP = [
  'T T T T T T T T T T T T T T T',
  'T g g g g g g g g g g g f g T',
  'T g g g g g g g g g g g g g T',
  'T g g g g g g f f g g g g g T',
  'T g g g g g s g g g g g g g T',
  'T p p p p p p p p p p p p p T',
  'T g F F F F g a w w w w a g T',
  'T G G G G G g a b b b b a g T',
  'T G G G G G g a w w w w a r T',
  'T T T T T T T T T T T T T T T',
].map((row) => row.split(' '));
const TILE_OF: Record<string, Tile> = {
  g: Tile.GRASS, G: Tile.TALL_GRASS, p: Tile.PATH, w: Tile.WATER, T: Tile.TREE, f: Tile.FLOWERS, F: Tile.FENCE,
  s: Tile.SIGN, r: Tile.ROCK, a: Tile.SAND, b: Tile.BRIDGE,
};
const NPCS: { id: CharacterId; col: number; row: number; dir: Direction; step: 0 | 1 | 2 }[] = [
  { id: 'bia', col: 8, row: 3, dir: 'down', step: 0 },
  { id: 'caio', col: 8, row: 5, dir: 'left', step: 0 },
  { id: 'zeca', col: 7, row: 7, dir: 'right', step: 0 },
  { id: 'player', col: 4, row: 7, dir: 'down', step: 1 },
];

function drawMockMap(): HTMLCanvasElement {
  const map = document.createElement('canvas');
  map.width = MAP[0].length * 16;
  map.height = MAP.length * 16;
  const m = map.getContext('2d')!;
  const tileCanvases = worldTiles.map(toCanvas);
  MAP.forEach((row, y) => row.forEach((ch, x) => m.drawImage(tileCanvases[TILE_OF[ch]], x * 16, y * 16)));
  m.drawImage(toCanvas(drawCenter()), 1 * 16, 1 * 16);
  m.drawImage(toCanvas(drawHouse()), 9 * 16, 2 * 16);
  for (const npc of [...NPCS].sort((a, b) => a.row - b.row)) {
    m.drawImage(toCanvas(drawCharacterFrame(npc.id, npc.dir, npc.step)), npc.col * 16, npc.row * 16 - 8);
    // Quem esta no capim alto tem os pes cobertos pelas laminas da frente.
    if (MAP[npc.row][npc.col] === 'G') m.drawImage(tileCanvases[Tile.TALL_GRASS_FRONT], npc.col * 16, npc.row * 16);
  }
  // O NPC que viu o jogador mostra o balao.
  m.drawImage(toCanvas(drawExclaim()), 8 * 16, 5 * 16 - 8 - 14);
  return map;
}

const mapY = worldY + 1000;
sectionLabel('mapa montado (x3) e tamanho real (x1)', mapY - 8);
ctx.drawImage(drawMockMap(), 4, mapY, 240 * MAP_ZOOM, 160 * MAP_ZOOM);
ctx.drawImage(drawMockMap(), 4 + 240 * MAP_ZOOM + 24, mapY, 240, 160);
