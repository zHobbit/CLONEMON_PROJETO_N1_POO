import Phaser from 'phaser';
import { ApiError } from '../api/client';
import type { Battle, Combatant, TurnAction, TurnResponse } from '../api/types';
import { C, PALETTE } from '../art/palette';
import { elementKey } from '../art/textures';
import type { HistoryEntry } from '../battle/history';
import { matchup, moveInfo, moveRow } from '../battle/labels';
import { Pace } from '../battle/pace';
import { planTurn, type ViewState, viewOf } from '../battle/playback';
import { SCENES, WIDTH } from '../config';
import { api } from '../services';
import { showHistory } from '../ui/HistoryPanel';
import { formatHp } from '../ui/hp';
import { onKey } from '../ui/input';
import { Menu } from '../ui/Menu';
import { TextBox } from '../ui/TextBox';
import { addFrame, addText, tween } from '../ui/widgets';
import { BattleStage } from './BattleStage';

interface BattleData {
  battle: Battle;
}

/** Valor que o menu de acoes devolve quando o jogador aperta H. */
const OPEN_HISTORY = -1;

/** Batalha por turnos no estilo GBA, animada a partir dos eventos estruturados da API. */
export class BattleScene extends Phaser.Scene {
  /** Exposto para os testes E2E. */
  battle!: Battle;
  private view!: ViewState;
  private stage!: BattleStage;
  private textBox!: TextBox;
  private actionCursor = 0;
  /** Tudo o que foi dito na batalha, por turno, para o painel de historico (tecla H). */
  private history: HistoryEntry[] = [];
  private turn = 0;
  private pace = new Pace();

  constructor() {
    super(SCENES.battle);
  }

  create(data: BattleData): void {
    this.battle = data.battle;
    this.view = viewOf(this.battle);
    this.actionCursor = 0;
    this.stage = new BattleStage(this, this.battle);
    this.textBox = new TextBox(this);
    this.turn = 0;
    this.history = this.battle.log.map((text) => ({ turn: 0, text }));
    this.pace = new Pace();
    this.setSpeed(1);
    void this.run();
  }

  /** Acelera (ou volta ao normal) texto e animacoes da cena. */
  private setSpeed(factor: number): void {
    this.tweens.timeScale = factor;
    this.time.timeScale = factor;
  }

  /** Mostra uma fala fora dos turnos (apresentacao) e guarda no historico. */
  private async narrate(text: string): Promise<void> {
    this.history.push({ turn: this.turn, text });
    await this.textBox.sayAndWait(text);
  }

  /** Batalha contra um treinador: nao da para fugir e ele tem um time. */
  private get trainer(): string | null {
    return this.battle.npcId ? (this.battle.npcName ?? this.battle.npcId.toUpperCase()) : null;
  }

  private active(): Combatant {
    return this.battle.playerTeam[this.battle.playerActive];
  }

  private async run(): Promise<void> {
    if (this.battle.log.length === 0) await this.intro();
    else await this.narrate('A batalha continua!');

    while (this.battle.status === 'AWAITING_ACTION') {
      const action = await this.chooseAction();
      if (!action) continue;

      let res: TurnResponse;
      try {
        res = await api.submitTurn(this.battle.id, action);
      } catch (e) {
        if (!this.scene.isActive()) return; // 401: ja fomos para o login
        await this.textBox.sayAndWait(
          e instanceof ApiError && e.status === 400 ? 'Isso nao e possivel agora.' : 'Erro de conexao. Tente de novo.',
        );
        continue;
      }
      this.stage.beginTurn(this.battle, res.battle, res.events);
      this.turn++;
      for (const e of res.events) this.history.push({ turn: this.turn, text: e.text });
      for (const step of planTurn(this.view, res.events)) {
        if (step.kind === 'text') await this.textBox.say(step.text);
        else if (step.kind === 'wait') await this.textBox.waitArrow();
        else await this.stage.play(step);
      }
      this.sync(res.battle);
      this.pace.afterTurn(res.events);
      this.setSpeed(this.pace.factor);
    }

    // De volta ao mapa, que precisa saber como acabou (derrota leva ao Centro; vitoria marca o treinador).
    const outcome = { status: this.battle.status, npcId: this.battle.npcId ?? null };
    const cam = this.cameras.main;
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(SCENES.world, { outcome }));
    cam.fadeOut(300);
  }

  private async intro(): Promise<void> {
    const player = this.stage.sprite('player');
    const enemySprite = this.stage.sprite('enemy');
    player.setAlpha(0);
    enemySprite.setX(this.stage.entryX('enemy'));
    const enemy = this.battle.enemy.name.toUpperCase();
    const trainer = this.trainer;
    if (trainer) await this.narrate(`${trainer} quer batalhar!`);
    await tween(this, { targets: enemySprite, x: this.stage.home('enemy').x, duration: 500, ease: 'Quad.Out' });
    await this.narrate(trainer ? `${trainer} enviou ${enemy}!` : `Um ${enemy} selvagem apareceu!`);
    player.setX(this.stage.entryX('player')).setAlpha(1);
    await tween(this, { targets: player, x: this.stage.home('player').x, duration: 400, ease: 'Quad.Out' });
    await this.narrate(`Vai, ${this.active().name.toUpperCase()}!`);
  }

  private async chooseAction(): Promise<TurnAction | null> {
    this.textBox.setWrapWidth(120);
    this.textBox.setText(`O que ${this.active().name.toUpperCase()} vai fazer?`);
    const frame = addFrame(this, 136, 112, 104, 48);
    const menu = new Menu(this, [{ label: 'LUTAR' }, { label: 'TIME' }, { label: 'FUGIR', disabled: this.trainer !== null }], {
      x: 140,
      y: 124,
      columns: 2,
      colWidth: 50,
      rowHeight: 14,
      initial: this.actionCursor,
    });
    // H abre o historico; o menu volta depois, com o cursor onde estava.
    const offHistory = onKey(this, (k) => {
      if (k === 'history') menu.close(OPEN_HISTORY);
    });
    const choice = await menu.choose();
    offHistory();
    menu.destroy();
    frame.destroy();
    this.textBox.setWrapWidth(null);
    this.textBox.setText('');
    if (choice === OPEN_HISTORY) {
      this.actionCursor = menu.selected;
      await showHistory(this, this.history);
      return null;
    }
    this.actionCursor = choice ?? 0;

    if (choice === 0) return this.chooseMove();
    if (choice === 1) return this.chooseSwitch();
    return { action: 'RUN' };
  }

  /** Ate 4 golpes (nome e PP), um por linha; embaixo, tipo, poder, precisao e efeito do selecionado. */
  private async chooseMove(): Promise<TurnAction | null> {
    const moves = this.active().moves ?? [];
    // Sobe um pouco acima da caixa de texto, ate encostar na caixa de informacoes do jogador.
    const panel = addFrame(this, 0, 106, WIDTH, 54);
    const type = this.add.image(12, 145, elementKey(moves[0]?.element ?? 'AGUA')).setOrigin(0);
    const info = addText(this, 26, 147, '');
    const defender = this.battle.enemy.element;
    const arrows = this.drawMatchupArrows(moves.map((m) => matchup(m, defender)));
    const menu = new Menu(
      this,
      moves.map((m) => ({ label: moveRow(m), disabled: (m.ppLeft ?? 0) === 0 })),
      {
        x: 2,
        y: 110,
        rowHeight: 9,
        cancellable: true,
        onHover: (i) => {
          type.setTexture(elementKey(moves[i].element));
          info.setText(moveInfo(moves[i], defender));
        },
      },
    );
    const choice = await menu.choose();
    menu.destroy();
    panel.destroy();
    type.destroy();
    info.destroy();
    arrows.destroy();
    return choice === null ? null : { action: 'MOVE', moveIndex: choice };
  }

  /** Seta no fim de cada linha de golpe: para cima (verde) se for super efetivo, para baixo (cinza) se for fraco. */
  private drawMatchupArrows(matchups: ReturnType<typeof matchup>[]): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    matchups.forEach((m, i) => {
      if (m === 'neutral') return;
      const x = 228;
      const y = 112 + i * 9;
      g.fillStyle(m === 'super' ? PALETTE[C.forest] : PALETTE[C.steel]);
      if (m === 'super') g.fillTriangle(x, y + 4, x + 6, y + 4, x + 3, y);
      else g.fillTriangle(x, y, x + 6, y, x + 3, y + 4);
    });
    return g;
  }

  private async chooseSwitch(): Promise<TurnAction | null> {
    const team = this.battle.playerTeam;
    const panel = addFrame(this, 0, 0, WIDTH, 112);
    const title = addText(this, 8, 6, 'TROCAR POR QUAL? (ESC VOLTA)');
    const menu = new Menu(
      this,
      team.map((c, i) => ({
        label: `${c.name.toUpperCase().padEnd(12)}Nv${String(c.level).padEnd(3)}${formatHp(c.currentHp, c.maxHp)}`,
        disabled: c.fainted || i === this.battle.playerActive,
      })),
      { x: 4, y: 22, rowHeight: 13, cancellable: true },
    );
    const choice = await menu.choose();
    menu.destroy();
    panel.destroy();
    title.destroy();
    return choice === null ? null : { action: 'SWITCH', teamIndex: choice };
  }

  /** Alinha a tela com o estado oficial devolvido pela API. */
  private sync(battle: Battle): void {
    this.battle = battle;
    this.view = viewOf(battle);
    this.stage.show(battle);
  }
}
