import Phaser from 'phaser';
import { type Key, mapKey } from './navigation';

/** Escuta as teclas do jogo ate a cena fechar ou ate chamar a funcao devolvida. */
export function onKey(scene: Phaser.Scene, handler: (key: Key) => void): () => void {
  const keyboard = scene.input.keyboard;
  if (!keyboard) return () => {};
  const listener = (e: KeyboardEvent) => {
    const key = mapKey(e.key);
    // Segurar Enter nao deve pular varias mensagens; setas podem repetir.
    if (!key || (e.repeat && (key === 'confirm' || key === 'cancel'))) return;
    handler(key);
  };
  keyboard.on('keydown', listener);
  const off = () => {
    keyboard.off('keydown', listener);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, off);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
  return off;
}

/** Espera Enter/Esc ou um clique. */
export function waitConfirm(scene: Phaser.Scene): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      off();
      scene.input.off('pointerdown', done);
      resolve();
    };
    const off = onKey(scene, (k) => {
      if (k === 'confirm' || k === 'cancel') done();
    });
    scene.input.once('pointerdown', done);
  });
}
