import '@fontsource/press-start-2p';
import './style.css';
import Phaser from 'phaser';
import { installAudio } from './audio/install';
import { COLORS, FONT_FAMILY, HEIGHT, SCENES, WIDTH } from './config';
import { installTransitions } from './fx/transitions';
import { BattleScene } from './scenes/BattleScene';
import { BootScene } from './scenes/BootScene';
import { HubScene } from './scenes/HubScene';
import { LoginScene } from './scenes/LoginScene';
import { StarterScene } from './scenes/StarterScene';
import { TeamScene } from './scenes/TeamScene';
import { TitleScene } from './scenes/TitleScene';
import { api } from './services';

/** Maior fator inteiro que cabe na janela: pixels sempre do mesmo tamanho. */
function integerZoom(): number {
  return Math.max(1, Math.floor(Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT)));
}

async function start(): Promise<void> {
  // O jogo carregou, entao nao foi aberto direto do disco: some com o aviso do index.html.
  document.getElementById('boot-hint')?.remove();
  try {
    await document.fonts.load(`8px ${FONT_FAMILY}`);
  } catch {
    /* segue com a fonte de fallback */
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: WIDTH,
    height: HEIGHT,
    pixelArt: true,
    backgroundColor: COLORS.page,
    scale: { mode: Phaser.Scale.NONE, zoom: integerZoom() },
    scene: [BootScene, TitleScene, LoginScene, StarterScene, HubScene, TeamScene, BattleScene],
    // Musica e efeitos vem do motor proprio (src/audio); o som do Phaser criaria outro AudioContext a toa.
    audio: { noAudio: true },
  });

  window.addEventListener('resize', () => game.scale.setZoom(integerZoom()));
  installAudio(game);
  installTransitions(game);

  api.onUnauthorized = () => {
    for (const scene of game.scene.getScenes(true)) scene.scene.stop();
    game.scene.start(SCENES.login, { message: 'Sua sessao expirou. Entre novamente.' });
  };

  // Usado pelos testes E2E, inclusive contra o deploy. Nao da para trapacear: o servidor decide tudo.
  (window as unknown as { __clonemon: unknown }).__clonemon = { game };
}

void start();
