import Phaser from 'phaser';
import { audio } from '../audio';
import { COLORS, HEIGHT, SCENES, WIDTH } from '../config';
import { delay, tween } from '../ui/widgets';

/** Duracao de cada metade do fade entre cenas. */
export const FADE_MS = 160;
const FLASHES = 3;
const FLASH_MS = 110;
const BARS = 8;
const BAR_MS = 230;
const BAR_STAGGER = 35;

/** Chama `listener` sempre que uma cena termina o create (inclusive ao reiniciar). */
export function onSceneCreate(game: Phaser.Game, listener: (scene: Phaser.Scene) => void): void {
  const attach = () => {
    for (const scene of game.scene.scenes) scene.events.on(Phaser.Scenes.Events.CREATE, () => listener(scene));
  };
  if (game.scene.isBooted) attach();
  else game.events.once(Phaser.Core.Events.READY, attach);
}

/** Toda cena, menos o Boot, entra clareando a partir do preto. */
export function installTransitions(game: Phaser.Game): void {
  onSceneCreate(game, (scene) => {
    if (scene.scene.key !== SCENES.boot) scene.cameras.main.fadeIn(FADE_MS);
  });
}

const leaving = new WeakSet<Phaser.Cameras.Scene2D.Camera>();

/**
 * Escurece a tela e troca de cena (a nova cena clareia sozinha). Pedidos repetidos
 * durante o fade sao ignorados; se a cena for parada antes (ex.: sessao expirada), nada acontece.
 */
export function fadeTo(scene: Phaser.Scene, key: string, data?: object): void {
  const cam = scene.cameras.main;
  if (leaving.has(cam)) return;
  leaving.add(cam);
  cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    if (scene.scene.isActive()) scene.scene.start(key, data);
  });
  cam.fadeOut(FADE_MS, 0, 0, 0);
}

/**
 * Entrada de batalha no estilo GBA: a musica de batalha comeca, a tela pisca
 * e listras pretas fecham a tela, alternando os lados. Depois e so iniciar a cena da batalha.
 */
export async function battleTransition(scene: Phaser.Scene): Promise<void> {
  audio.playMusic('battle');
  const cam = scene.cameras.main;
  for (let i = 0; i < FLASHES; i++) {
    cam.flash(FLASH_MS, 255, 255, 255, true);
    await delay(scene, FLASH_MS + 40);
  }
  const h = HEIGHT / BARS;
  await Promise.all(
    Array.from({ length: BARS }, (_, i) => {
      const fromLeft = i % 2 === 0;
      // Presas a tela e acima de tudo (o mapa tem camera que se move e camadas altas).
      const bar = scene.add.rectangle(fromLeft ? -WIDTH : WIDTH, i * h, WIDTH, h, COLORS.page).setOrigin(0).setScrollFactor(0).setDepth(100_000);
      return tween(scene, { targets: bar, x: 0, delay: i * BAR_STAGGER, duration: BAR_MS, ease: 'Quad.In' });
    }),
  );
}
