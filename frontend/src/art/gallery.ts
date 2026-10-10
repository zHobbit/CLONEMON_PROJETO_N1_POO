import type { Element } from '../api/types';
import { ELEMENT_ICON_SIZE, drawElementIcon } from './icons';
import { ICON_SIZE, SPRITE_SIZE, drawIcon, drawMonster } from './monsters';
import type { PixelCanvas } from './raster';
import { BATTLE_BG, drawBattleBackground, drawMenuTile, drawTitleBackground } from './scenery';

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

const canvas = document.getElementById('gallery') as HTMLCanvasElement;
canvas.width = Math.max(LEFT + CELL * COLUMNS.length + 60, 4 + (SCENE_W + 16) * 2);
const monstersHeight = 24 + CELL * SPECIES.length;
const battlesY = monstersHeight + 40;
const sceneY = battlesY + Math.ceil(BATTLES.length / 2) * SCENE_ROW + 8;
canvas.height = sceneY + 320 + 24;
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
