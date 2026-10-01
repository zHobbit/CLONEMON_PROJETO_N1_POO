import Phaser from 'phaser';
import { ApiError } from '../api/client';
import type { Battle, Combatant, TurnAction, TurnResponse } from '../api/types';
import { monsterTexture } from '../art/placeholder';
import { planTurn, type Side, type Step, type ViewState, viewOf } from '../battle/playback';
import { COLORS, SCENES, WIDTH } from '../config';
import { api } from '../services';
import { formatHp } from '../ui/hp';
import { HpBar } from '../ui/HpBar';
import { Menu } from '../ui/Menu';
import { TextBox } from '../ui/TextBox';
import { addFrame, addText, tween } from '../ui/widgets';

interface BattleData {
  battle: Battle;
}

const ENEMY_POS = { x: 176, y: 42 };
const PLAYER_POS = { x: 60, y: 84 };

/** Nome, nivel e HP de um lado da batalha. */
class InfoBox {
  private readonly name: Phaser.GameObjects.Text;
  private readonly level: Phaser.GameObjects.Text;
  private readonly numbers?: Phaser.GameObjects.Text;
  private readonly bar: HpBar;
  private max = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, w: number, showNumbers: boolean) {
    addFrame(scene, x, y, w, showNumbers ? 36 : 26);
    this.name = addText(scene, x + 6, y + 5, '');
    this.level = addText(scene, x + 6, y + 15, '');
    if (showNumbers) this.numbers = addText(scene, x + w - 6, y + 25, '').setOrigin(1, 0);
    this.bar = new HpBar(scene, x + 42, y + 15, 48, (hp) => this.numbers?.setText(formatHp(hp, this.max)));
  }

  show(c: Combatant, hp = c.currentHp): void {
    this.max = c.maxHp;
    this.name.setText(c.name.toUpperCase());
    this.level.setText(`Nv${c.level}`);
    void this.bar.set(hp, c.maxHp);
  }

  setHp(hp: number, animate: boolean): Promise<void> {
    return this.bar.set(hp, this.max, animate);
  }
}

/** Batalha por turnos no estilo GBA, animada a partir dos eventos estruturados da API. */
export class BattleScene extends Phaser.Scene {
  /** Exposto para os testes E2E. */
  battle!: Battle;
  private view!: ViewState;
  private enemySprite!: Phaser.GameObjects.Image;
  private playerSprite!: Phaser.GameObjects.Image;
  private enemyInfo!: InfoBox;
  private playerInfo!: InfoBox;
  private textBox!: TextBox;
  private actionCursor = 0;

  constructor() {
    super(SCENES.battle);
  }

  create(data: BattleData): void {
    this.battle = data.battle;
    this.view = viewOf(this.battle);
    this.actionCursor = 0;
    this.drawBackground();
    this.enemySprite = this.add.image(ENEMY_POS.x, ENEMY_POS.y, monsterTexture(this.battle.enemy.speciesId, 'front'));
    this.playerSprite = this.add.image(PLAYER_POS.x, PLAYER_POS.y, monsterTexture(this.active().speciesId, 'back'));
    this.enemyInfo = new InfoBox(this, 4, 6, 116, false);
    this.playerInfo = new InfoBox(this, 120, 70, 116, true);
    this.textBox = new TextBox(this);
    this.enemyInfo.show(this.battle.enemy);
    this.playerInfo.show(this.active());
    void this.run();
  }

  private active(): Combatant {
    return this.battle.playerTeam[this.battle.playerActive];
  }

  private drawBackground(): void {
    this.cameras.main.setBackgroundColor(COLORS.sky);
    const g = this.add.graphics();
    for (const [pos, w, h] of [[ENEMY_POS, 88, 18], [PLAYER_POS, 108, 22]] as const) {
      g.fillStyle(COLORS.groundDark);
      g.fillEllipse(pos.x, pos.y + h + 4, w, h);
      g.fillStyle(COLORS.ground);
      g.fillEllipse(pos.x, pos.y + h + 2, w - 8, h - 6);
    }
  }

  private async run(): Promise<void> {
    if (this.battle.log.length === 0) await this.intro();
    else await this.textBox.sayAndWait('A batalha continua!');

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
      for (const step of planTurn(this.view, res.events)) await this.play(step);
      this.sync(res.battle);
    }

    const cam = this.cameras.main;
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(SCENES.hub));
    cam.fadeOut(300);
  }

  private async intro(): Promise<void> {
    this.playerSprite.setAlpha(0);
    this.enemySprite.setX(WIDTH + 40);
    await tween(this, { targets: this.enemySprite, x: ENEMY_POS.x, duration: 500, ease: 'Quad.Out' });
    await this.textBox.sayAndWait(`Um ${this.battle.enemy.name.toUpperCase()} selvagem apareceu!`);
    this.playerSprite.setX(-40).setAlpha(1);
    await tween(this, { targets: this.playerSprite, x: PLAYER_POS.x, duration: 400, ease: 'Quad.Out' });
    await this.textBox.sayAndWait(`Vai, ${this.active().name.toUpperCase()}!`);
  }

  private async chooseAction(): Promise<TurnAction | null> {
    this.textBox.setWrapWidth(120);
    this.textBox.setText(`O que ${this.active().name.toUpperCase()} vai fazer?`);
    const frame = addFrame(this, 136, 112, 104, 48);
    const menu = new Menu(this, [{ label: 'LUTAR' }, { label: 'TIME' }, { label: 'FUGIR' }], {
      x: 140,
      y: 124,
      columns: 2,
      colWidth: 50,
      rowHeight: 14,
      initial: this.actionCursor,
    });
    const choice = await menu.choose();
    menu.destroy();
    frame.destroy();
    this.textBox.setWrapWidth(null);
    this.textBox.setText('');
    this.actionCursor = choice ?? 0;

    if (choice === 0) return this.chooseMove();
    if (choice === 1) return this.chooseSwitch();
    return { action: 'RUN' };
  }

  private async chooseMove(): Promise<TurnAction | null> {
    const moves = this.active().moves ?? [];
    const panel = addFrame(this, 0, 112, WIDTH, 48);
    const info = addText(this, 8, 144, '');
    const menu = new Menu(
      this,
      moves.map((m) => ({
        label: `${m.name.toUpperCase().padEnd(19)} ${String(m.ppLeft ?? 0).padStart(2)}/${m.maxPp}`,
        disabled: (m.ppLeft ?? 0) === 0,
      })),
      {
        x: 4,
        y: 120,
        cancellable: true,
        onHover: (i) => info.setText(`TIPO ${moves[i].element}  POD ${moves[i].power}  PREC ${moves[i].accuracy}`),
      },
    );
    const choice = await menu.choose();
    menu.destroy();
    panel.destroy();
    info.destroy();
    return choice === null ? null : { action: 'MOVE', moveIndex: choice };
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

  private async play(step: Step): Promise<void> {
    switch (step.kind) {
      case 'text':
        return this.textBox.say(step.text);
      case 'wait':
        return this.textBox.waitArrow();
      case 'flash':
        return tween(this, { targets: this.sprite(step.side), alpha: 0, duration: 70, yoyo: true, repeat: 2 });
      case 'hp':
        return this.info(step.side).setHp(step.to, true);
      case 'faint': {
        const s = this.sprite(step.side);
        return tween(this, { targets: s, y: s.y + 24, alpha: 0, duration: 400, ease: 'Quad.In' });
      }
      case 'switch':
        return this.switchTo(step.teamIndex, step.hp);
    }
  }

  private async switchTo(index: number, hp: number): Promise<void> {
    const c = this.battle.playerTeam[index];
    const s = this.playerSprite;
    if (s.alpha > 0) await tween(this, { targets: s, x: -40, alpha: 0, duration: 250 });
    s.setTexture(monsterTexture(c.speciesId, 'back')).setPosition(-40, PLAYER_POS.y).setAlpha(1);
    this.playerInfo.show(c, hp);
    await tween(this, { targets: s, x: PLAYER_POS.x, duration: 300, ease: 'Quad.Out' });
  }

  /** Alinha a tela com o estado oficial devolvido pela API. */
  private sync(battle: Battle): void {
    this.battle = battle;
    this.view = viewOf(battle);
    const a = this.active();
    this.playerSprite
      .setTexture(monsterTexture(a.speciesId, 'back'))
      .setPosition(PLAYER_POS.x, PLAYER_POS.y)
      .setAlpha(a.fainted ? 0 : 1);
    this.enemySprite
      .setTexture(monsterTexture(battle.enemy.speciesId, 'front'))
      .setPosition(ENEMY_POS.x, ENEMY_POS.y)
      .setAlpha(battle.enemy.fainted ? 0 : 1);
    this.enemyInfo.show(battle.enemy);
    this.playerInfo.show(a);
  }

  private sprite(side: Side): Phaser.GameObjects.Image {
    return side === 'player' ? this.playerSprite : this.enemySprite;
  }

  private info(side: Side): InfoBox {
    return side === 'player' ? this.playerInfo : this.enemyInfo;
  }
}
