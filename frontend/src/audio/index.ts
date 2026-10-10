import { AudioEngine } from './engine';

export type { SfxName } from './sfx';
export type { JingleName, Track } from './songs';

/** O audio do jogo inteiro (um AudioContext so). Veja install.ts para os gatilhos globais. */
export const audio = new AudioEngine();
