import type Phaser from 'phaser';
import { HEIGHT, WIDTH } from './config';
import { onSceneCreate } from './fx/transitions';

/**
 * O jogo continua pensado em 240x160 (coordenadas, mapa, menus, texto), mas o canvas tem o tamanho
 * real da tela: 240x160 vezes um zoom inteiro. Toda cena olha para ele com a camera ampliada, entao a
 * arte de pixels fica igual, so maior, e a arte HD (batalha e titulo) usa a resolucao inteira.
 */

/** Maior fator inteiro que cabe na janela: pixels sempre do mesmo tamanho. */
export function fitZoom(): number {
  return Math.max(1, Math.floor(Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT)));
}

let zoom = fitZoom();

export function viewZoom(): number {
  return zoom;
}

/**
 * Origem no canto: a camera do Phaser amplia em volta do centro, o que tiraria do lugar tudo o que
 * fica preso a tela (setScrollFactor(0)). Com a origem no canto, a posicao na tela e so coordenada x zoom.
 */
function fit(scene: Phaser.Scene): void {
  scene.cameras.main.setOrigin(0, 0).setZoom(zoom);
}

export function installViewZoom(game: Phaser.Game): void {
  onSceneCreate(game, fit);
  window.addEventListener('resize', () => {
    const next = fitZoom();
    if (next === zoom) return;
    zoom = next;
    game.scale.resize(WIDTH * zoom, HEIGHT * zoom);
    for (const scene of game.scene.getScenes(true)) fit(scene);
  });
}
