import '@fontsource/press-start-2p';
import './style.css';
import Phaser from 'phaser';
import { installAudio } from './audio/install';
import { COLORS, FONT_FAMILY, HEIGHT, SCENES, WIDTH } from './config';
import { installTransitions } from './fx/transitions';
import { BattleScene } from './scenes/BattleScene';
import { ReplayListScene } from './scenes/ReplayListScene';
import { ReplayScene } from './scenes/ReplayScene';
import { BootScene } from './scenes/BootScene';
import { LoginScene } from './scenes/LoginScene';
import { StarterScene } from './scenes/StarterScene';
import { TeamScene } from './scenes/TeamScene';
import { TitleScene } from './scenes/TitleScene';
import { WorldScene } from './scenes/WorldScene';
import { api } from './services';
import { installViewZoom, viewZoom } from './view';

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
    // O canvas tem o tamanho real da tela; as cenas seguem em 240x160 com a camera ampliada (ver view.ts).
    width: WIDTH * viewZoom(),
    height: HEIGHT * viewZoom(),
    pixelArt: true,
    backgroundColor: COLORS.page,
    scale: { mode: Phaser.Scale.NONE },
    scene: [BootScene, TitleScene, LoginScene, StarterScene, WorldScene, TeamScene, BattleScene, ReplayListScene, ReplayScene],
    // Musica e efeitos vem do motor proprio (src/audio); o som do Phaser criaria outro AudioContext a toa.
    audio: { noAudio: true },
  });

  installViewZoom(game);
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
