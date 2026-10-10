import Phaser from 'phaser';
import type { Battle, TurnResponse } from '../api/types';
import { audio } from '../audio';
import type { Side } from '../battle/playback';
import { NO_CUES, type TurnCues, turnCues } from './cues';
import { playHitEffect } from './hitEffects';

const SHAKE_MS = 160;
const SHAKE_INTENSITY = 0.012;
/** A fanfarra entra depois do som de desmaio. */
const JINGLE_DELAY = 0.55;

/**
 * Som e efeitos visuais da batalha. A cena chama um metodo por passo de animacao
 * (golpe, HP, desmaio); o que tocar vem de turnCues, calculado uma vez por turno.
 */
export class BattleFx {
  private cues: TurnCues = NO_CUES;
  private nextHit = 0;
  private enemyFainted = false;
  private leveled = false;

  constructor(private readonly scene: Phaser.Scene) {}

  /** Antes de animar um turno: `before` e o estado que esta na tela. */
  beginTurn(before: Battle, res: TurnResponse): void {
    this.cues = turnCues(before, res.battle, res.events);
    this.nextHit = 0;
    this.enemyFainted = false;
    this.leveled = false;
  }

  /** O alvo foi atingido: efeito do elemento de quem atacou, som e, se o golpe foi pesado, a tela treme. */
  hit(target: Side, sprite: Phaser.GameObjects.Sprite): void {
    const index = this.cues.hits.findIndex((h, i) => i >= this.nextHit && h.target === target);
    const cue = index >= 0 ? this.cues.hits[index] : undefined;
    if (cue) {
      this.nextHit = index + 1;
      playHitEffect(this.scene, cue.element, sprite.x, sprite.y - 2);
      if (cue.heavy) this.scene.cameras.main.shake(SHAKE_MS, SHAKE_INTENSITY);
    }
    audio.sfx(cue?.strong ? 'strongHit' : 'hit');
  }

  /** O HP do jogador sobe depois de vencer: so pode ser subida de nivel. */
  hp(side: Side): void {
    if (side !== 'player' || !this.enemyFainted || !this.cues.levelUp || this.leveled) return;
    this.leveled = true;
    audio.sfx('levelUp');
  }

  faint(side: Side): void {
    audio.sfx('faint');
    if (side === 'enemy') {
      this.enemyFainted = true;
      if (this.cues.outcome === 'victory') audio.playJingle('victory', JINGLE_DELAY);
    } else if (this.cues.outcome === 'defeat') {
      audio.playJingle('defeat', JINGLE_DELAY);
    }
  }
}
