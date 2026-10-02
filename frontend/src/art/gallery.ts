import type { Element } from '../api/types';
import { ELEMENT_ICON_SIZE, drawElementIcon } from './icons';
import { ICON_SIZE, SPRITE_SIZE, drawIcon, drawMonster } from './monsters';
import type { PixelCanvas } from './raster';
import { BATTLE_BG, drawBattleBackground, drawMenuTile, drawTitleBackground } from './scenery';

/** Pagina de desenvolvimento (/art.html): toda a arte ampliada, para revisao. */

const SPECIES: [string, Element][] = [
  ['Lindoya', 'AGUA'], ['Coiso', 'ROCHA'], ['Lucifer', 'FOGO'], ['Olaf', 'GELO'], ['Groot', 'GRAMA'], ['EletroPaulo', 'RAIO'],
];
const ZOOM = 4;
const CELL = SPRITE_SIZE * ZOOM + 8;
const LEFT = 110;
const COLUMNS = ['frente 0', 'frente 1', 'costas 0', 'costas 1', 'icone'];
const SCENE_ZOOM = 3;

const canvas = document.getElementById('gallery') as HTMLCanvasElement;
canvas.width = LEFT + CELL * COLUMNS.length;
const monstersHeight = 24 + CELL * SPECIES.length;
canvas.height = monstersHeight + 80 + BATTLE_BG.height * SCENE_ZOOM + 24;
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
  ctx.fillRect(LEFT + 4 * CELL, y + ICON_SIZE * ZOOM * 2 + 8, ELEMENT_ICON_SIZE * ZOOM * 2, ELEMENT_ICON_SIZE * ZOOM * 2);
  blit(drawElementIcon(element), LEFT + 4 * CELL, y + ICON_SIZE * ZOOM * 2 + 8, ZOOM * 2);
});

// Cena de batalha montada com os assets reais, no tamanho do jogo x3.
const sceneY = monstersHeight + 40;
label('batalha (x3)', 4, sceneY - 8);
const battle = toCanvas(drawBattleBackground());
const bctx = battle.getContext('2d')!;
const enemy = toCanvas(drawMonster('Lucifer', 'FOGO', 'front', 0));
const player = toCanvas(drawMonster('Olaf', 'GELO', 'back', 0));
bctx.drawImage(enemy, BATTLE_BG.enemy.x - 24, BATTLE_BG.enemy.y - 44);
bctx.drawImage(player, BATTLE_BG.player.x - 24, BATTLE_BG.player.y - 44);
ctx.drawImage(battle, 4, sceneY, BATTLE_BG.width * SCENE_ZOOM, BATTLE_BG.height * SCENE_ZOOM);

const titleX = 4 + BATTLE_BG.width * SCENE_ZOOM + 16;
label('titulo (x2)', titleX, sceneY - 8);
blit(drawTitleBackground(), titleX, sceneY, 2);
label('menu (x4)', titleX + 500, sceneY - 8);
const tile = drawMenuTile();
for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) blit(tile, titleX + 500 + i * 64, sceneY + j * 64, ZOOM);
