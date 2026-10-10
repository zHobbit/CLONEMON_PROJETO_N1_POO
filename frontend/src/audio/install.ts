import Phaser from 'phaser';
import { drawMuteIcon } from '../art/effects';
import { SCENES } from '../config';
import { onSceneCreate } from '../fx/transitions';
import { audio } from './index';
import type { Track } from './songs';

/** Musica de cada cena; o titulo e os menus compartilham o mesmo tema. */
const SCENE_MUSIC: Readonly<Record<string, Track>> = {
  [SCENES.title]: 'title',
  [SCENES.login]: 'title',
  [SCENES.starter]: 'title',
  [SCENES.world]: 'title',
  [SCENES.team]: 'title',
  [SCENES.battle]: 'battle',
};

/** Digitando no formulario de login, "m" e so uma letra. */
function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
}

/** Icone de "sem som" no canto da tela do jogo, em pixels do mesmo tamanho dos do jogo. */
function muteIndicator(game: Phaser.Game): (muted: boolean) => void {
  const parent = document.getElementById('game');
  if (!parent) return () => {};
  const icon = drawMuteIcon();
  const canvas = document.createElement('canvas');
  canvas.id = 'mute-indicator';
  canvas.width = icon.width;
  canvas.height = icon.height;
  canvas.title = 'Som desligado (M liga)';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Som desligado');
  canvas.getContext('2d')?.putImageData(new ImageData(icon.rgba() as Uint8ClampedArray<ArrayBuffer>, icon.width, icon.height), 0, 0);
  parent.append(canvas);

  const layout = () => {
    const zoom = game.scale.zoom || 1;
    canvas.style.width = `${icon.width * zoom}px`;
    canvas.style.height = `${icon.height * zoom}px`;
    canvas.style.top = canvas.style.right = `${2 * zoom}px`;
  };
  layout();
  game.events.once(Phaser.Core.Events.READY, layout);
  window.addEventListener('resize', () => requestAnimationFrame(layout));
  return (muted) => {
    canvas.hidden = !muted;
  };
}

/**
 * Liga o audio ao jogo: libera o som no primeiro gesto (regra de autoplay dos navegadores),
 * troca a musica conforme a cena, pausa com a aba escondida e alterna o mudo com a tecla M.
 */
export function installAudio(game: Phaser.Game): void {
  const unlock = () => audio.unlock();
  window.addEventListener('keydown', unlock, true);
  window.addEventListener('pointerdown', unlock, true);

  window.addEventListener('keydown', (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
    if (e.key === 'm' || e.key === 'M') audio.toggleMute();
  });

  document.addEventListener('visibilitychange', () => audio.setHidden(document.hidden));

  const showMuted = muteIndicator(game);
  showMuted(audio.muted);
  audio.onMuteChange(showMuted);

  onSceneCreate(game, (scene) => {
    const track = SCENE_MUSIC[scene.scene.key];
    if (track) audio.playMusic(track);
  });
}
