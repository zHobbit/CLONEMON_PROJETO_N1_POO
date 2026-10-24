import Phaser from 'phaser';
import { ApiError } from '../api/client';
import type { Replay } from '../api/types';
import { planTurn, viewOf } from '../battle/playback';
import { CSS, SCENES } from '../config';
import { fadeTo } from '../fx/transitions';
import { SPEEDS, footerLabel, nextSpeed } from '../replay/controls';
import { battleAfter, captionAt, replayHistory } from '../replay/timeline';
import { api } from '../services';
import { showHistory } from '../ui/HistoryPanel';
import { onKey, waitConfirm } from '../ui/input';
import type { Key } from '../ui/navigation';
import { TextBox } from '../ui/TextBox';
import { addText, delay } from '../ui/widgets';
import { BattleStage, type Perspective } from './BattleStage';

interface ReplayData {
  id: number;
}

/** Tempo que cada fala fica na tela antes da proxima (dividido pela velocidade). */
const TEXT_HOLD_MS = 700;
/** Velocidade usada para terminar depressa o turno em andamento (seta para a direita). */
const SKIP_SPEED = 20;

/**
 * Toca uma batalha gravada com a mesma arena da batalha ao vivo. Enter pausa, setas pulam turnos
 * (direita/esquerda) e mudam a velocidade (cima/baixo), V espelha, H abre o historico e Esc volta a lista.
 */
export class ReplayScene extends Phaser.Scene {
  /** Exposto para os testes E2E. */
  replay: Replay | null = null;
  turn = 0;
  playing = true;
  perspective: Perspective = 'player';
  private speed = 0;
  private stage!: BattleStage;
  private textBox!: TextBox;
  private footer!: Phaser.GameObjects.Text;
  private animating = false;
  private modal = false;
  private skipping = false;
  private pendingJump: number | null = null;
  private pendingFlip = false;
  private wake: (() => void) | null = null;

  constructor() {
    super(SCENES.replay);
  }

  create(data: ReplayData): void {
    this.replay = null;
    this.turn = 0;
    this.playing = true;
    this.perspective = 'player';
    this.speed = 0;
    this.animating = this.modal = this.skipping = this.pendingFlip = false;
    this.pendingJump = null;
    this.wake = null;
    this.setSpeed(1);
    void this.fetchReplay(data.id);
  }

  private async fetchReplay(id: number): Promise<void> {
    let replay: Replay;
    try {
      replay = await api.replay(id);
    } catch (e) {
      if (!this.scene.isActive()) return;
      addText(this, 8, 8, e instanceof ApiError && e.status === 404 ? 'REPLAY NAO ENCONTRADO' : 'ERRO DE CONEXAO', { color: CSS.paper });
      await waitConfirm(this);
      fadeTo(this, SCENES.replays);
      return;
    }
    this.replay = replay;
    this.stage = new BattleStage(this, battleAfter(replay, 0));
    this.textBox = new TextBox(this);
    this.textBox.setText(captionAt(replay, 0));
    this.footer = addText(this, 236, 1, '', { color: CSS.paper, stroke: CSS.ink, strokeThickness: 2 }).setOrigin(1, 0);
    onKey(this, (k) => this.onKey(k));
    void this.loop();
  }

  private setSpeed(factor: number): void {
    this.tweens.timeScale = factor;
    this.time.timeScale = factor;
  }

  private renderFooter(): void {
    if (this.replay) this.footer.setText(footerLabel(this.turn, this.replay.turns.length, this.speed, this.playing));
  }

  private async loop(): Promise<void> {
    const replay = this.replay!;
    while (this.scene.isActive()) {
      this.applyPending();
      this.renderFooter();
      if (this.playing && this.turn < replay.turns.length) {
        await this.playTurn(this.turn);
        this.turn++;
        if (this.turn >= replay.turns.length) this.playing = false;
        continue;
      }
      await new Promise<void>((resolve) => (this.wake = resolve));
      this.wake = null;
    }
  }

  private async playTurn(k: number): Promise<void> {
    const replay = this.replay!;
    const before = battleAfter(replay, k);
    const after = battleAfter(replay, k + 1);
    const events = replay.turns[k].events;
    this.animating = true;
    this.stage.beginTurn(before, after, events);
    for (const step of planTurn(viewOf(before), events)) {
      if (step.kind === 'text') await this.textBox.say(step.text);
      else if (step.kind === 'wait') await delay(this, TEXT_HOLD_MS);
      else await this.stage.play(step);
    }
    this.stage.show(after);
    this.animating = false;
    this.skipping = false;
    this.setSpeed(SPEEDS[this.speed]);
  }

  /** Saltos e espelho pedidos durante um turno so valem quando ele termina. */
  private applyPending(): void {
    const replay = this.replay!;
    if (this.pendingFlip) {
      this.pendingFlip = false;
      this.perspective = this.perspective === 'player' ? 'enemy' : 'player';
      this.stage.setPerspective(this.perspective);
    }
    if (this.pendingJump !== null) {
      this.turn = this.pendingJump;
      this.pendingJump = null;
      this.stage.show(battleAfter(replay, this.turn));
      this.textBox.setText(captionAt(replay, this.turn));
    }
  }

  private onKey(k: Key): void {
    const replay = this.replay;
    if (!replay || this.modal) return;
    const total = replay.turns.length;
    switch (k) {
      case 'confirm':
        this.playing = !this.playing;
        if (this.playing && this.turn >= total) this.pendingJump = 0; // no fim, Enter recomeca
        break;
      case 'right':
        if (this.animating) {
          this.skipping = true;
          this.setSpeed(SKIP_SPEED);
        } else {
          this.playing = false;
          this.pendingJump = Math.min(total, (this.pendingJump ?? this.turn) + 1);
        }
        break;
      case 'left':
        this.playing = false;
        if (this.animating) {
          this.skipping = true;
          this.setSpeed(SKIP_SPEED);
          this.pendingJump = this.turn;
        } else {
          this.pendingJump = Math.max(0, (this.pendingJump ?? this.turn) - 1);
        }
        break;
      case 'up':
      case 'down':
        this.speed = nextSpeed(this.speed, k === 'up' ? 1 : -1);
        if (!this.skipping) this.setSpeed(SPEEDS[this.speed]);
        break;
      case 'view':
        this.pendingFlip = true;
        break;
      case 'history':
        if (this.animating) return;
        this.playing = false;
        this.modal = true;
        void showHistory(this, replayHistory(replay, this.turn)).then(() => {
          this.modal = false;
          this.renderFooter();
        });
        break;
      case 'cancel':
        this.modal = true;
        fadeTo(this, SCENES.replays);
        return;
    }
    this.renderFooter();
    this.wake?.();
  }
}
