import Phaser from 'phaser';
import { ApiError } from '../api/client';
import type { Battle, Combatant, StatusCondition, TurnAction, TurnResponse } from '../api/types';
import { C, PALETTE } from '../art/palette';
import { BATTLE_BG } from '../art/scenery';
import { BG, addMonster, elementKey, showMonster } from '../art/textures';
import { STATUS_BADGE, moveInfo, moveRow } from '../battle/labels';
import { planTurn, type Side, type Step, type ViewState, viewOf } from '../battle/playback';
import { COLORS, CSS, SCENES, WIDTH } from '../config';
import { api } from '../services';
import { formatHp } from '../ui/hp';
import { HpBar } from '../ui/HpBar';
import { Menu } from '../ui/Menu';
import { TextBox } from '../ui/TextBox';
import { addFrame, addText, tween } from '../ui/widgets';

interface BattleData {
  battle: Battle;
}

/** Centro dos sprites 48x48, com os pes sobre as plataformas desenhadas no fundo. */
const ENEMY_POS = { x: BATTLE_BG.enemy.x, y: BATTLE_BG.enemy.y - 20 };
const PLAYER_POS = { x: BATTLE_BG.player.x, y: BATTLE_BG.player.y - 20 };
const LUNGE = 8;

/** Cor do selo de status e da letra sobre ele. */
const BADGE_STYLE: Record<Exclude<StatusCondition, 'NONE'>, { fill: number; ink: string }> = {
  BURN: { fill: PALETTE[C.red], ink: CSS.paper },
  FREEZE: { fill: PALETTE[C.blue], ink: CSS.paper },
  PARALYSIS: { fill: PALETTE[C.amber], ink: CSS.ink },
  SLEEP: { fill: PALETTE[C.slate], ink: CSS.paper },
};

/** Nome, tipo, nivel, HP e selo de status de um lado da batalha. */
class InfoBox {
  private readonly name: Phaser.GameObjects.Text;
  private readonly type: Phaser.GameObjects.Image;
  private readonly level: Phaser.GameObjects.Text;
  private readonly numbers?: Phaser.GameObjects.Text;
  private readonly bar: HpBar;
  private readonly badge: Phaser.GameObjects.Graphics;
  private readonly badgeText: Phaser.GameObjects.Text;
  private max = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, w: number, showNumbers: boolean) {
    addFrame(scene, x, y, w, 36);
    this.name = addText(scene, x + 6, y + 5, '');
    this.type = scene.add.image(0, y + 3, elementKey('AGUA')).setOrigin(0);
    this.level = addText(scene, x + 6, y + 15, '');
    if (showNumbers) this.numbers = addText(scene, x + w - 6, y + 25, '').setOrigin(1, 0);
    this.bar = new HpBar(scene, x + 42, y + 15, 48, (hp) => this.numbers?.setText(formatHp(hp, this.max)));
    this.badge = scene.add.graphics().setPosition(x + 6, y + 24);
    this.badgeText = addText(scene, x + 8, y + 25, '');
  }

  show(c: Combatant, hp = c.currentHp): void {
    this.max = c.maxHp;
    this.name.setText(c.name.toUpperCase());
    this.type.setTexture(elementKey(c.element)).setX(this.name.x + this.name.width + 3);
    this.level.setText(`Nv${c.level}`);
    this.setStatus(c.status);
    void this.bar.set(hp, c.maxHp);
  }

  setHp(hp: number, animate: boolean): Promise<void> {
    return this.bar.set(hp, this.max, animate);
  }

  /** Selo de 3 letras no canto de baixo ("QUE", "PAR"...); some sem status. */
  setStatus(status: StatusCondition): void {
    this.badge.clear();
    this.badgeText.setText(STATUS_BADGE[status]);
    if (status === 'NONE') return;
    const style = BADGE_STYLE[status];
    this.badge.fillStyle(COLORS.frame);
    this.badge.fillRect(0, 0, 28, 10);
    this.badge.fillStyle(style.fill);
    this.badge.fillRect(1, 1, 26, 8);
    this.badgeText.setColor(style.ink);
  }
}

/** Batalha por turnos no estilo GBA, animada a partir dos eventos estruturados da API. */
export class BattleScene extends Phaser.Scene {
  /** Exposto para os testes E2E. */
  battle!: Battle;
  private view!: ViewState;
  private enemySprite!: Phaser.GameObjects.Sprite;
  private playerSprite!: Phaser.GameObjects.Sprite;
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
    this.add.image(0, 0, BG.battle).setOrigin(0);
    this.enemySprite = addMonster(this, ENEMY_POS.x, ENEMY_POS.y, this.battle.enemy.speciesId, 'front');
    this.playerSprite = addMonster(this, PLAYER_POS.x, PLAYER_POS.y, this.active().speciesId, 'back');
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

  /** Ate 4 golpes (nome e PP), um por linha; embaixo, tipo, poder, precisao e efeito do selecionado. */
  private async chooseMove(): Promise<TurnAction | null> {
    const moves = this.active().moves ?? [];
    // Sobe um pouco acima da caixa de texto, ate encostar na caixa de informacoes do jogador.
    const panel = addFrame(this, 0, 106, WIDTH, 54);
    const type = this.add.image(12, 145, elementKey(moves[0]?.element ?? 'AGUA')).setOrigin(0);
    const info = addText(this, 26, 147, '');
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
          info.setText(moveInfo(moves[i]));
        },
      },
    );
    const choice = await menu.choose();
    menu.destroy();
    panel.destroy();
    type.destroy();
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
      case 'attack': {
        // Investida na direcao do oponente: o jogador sobe para a direita, o inimigo desce para a esquerda.
        const dir = step.side === 'player' ? 1 : -1;
        const s = this.sprite(step.side);
        return tween(this, { targets: s, x: s.x + dir * LUNGE, y: s.y - dir * LUNGE / 2, duration: 90, yoyo: true, ease: 'Quad.Out' });
      }
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
      case 'status':
        this.info(step.side).setStatus(step.status);
        return;
      case 'stat': {
        // Sobe ou desce duas vezes, na direcao da mudanca.
        const s = this.sprite(step.side);
        return tween(this, { targets: s, y: s.y + (step.up ? -3 : 3), duration: 90, yoyo: true, repeat: 1 });
      }
    }
  }

  private async switchTo(index: number, hp: number): Promise<void> {
    const c = this.battle.playerTeam[index];
    const s = this.playerSprite;
    if (s.alpha > 0) await tween(this, { targets: s, x: -40, alpha: 0, duration: 250 });
    showMonster(s, c.speciesId, 'back');
    s.setPosition(-40, PLAYER_POS.y).setAlpha(1);
    this.playerInfo.show(c, hp);
    await tween(this, { targets: s, x: PLAYER_POS.x, duration: 300, ease: 'Quad.Out' });
  }

  /** Alinha a tela com o estado oficial devolvido pela API. */
  private sync(battle: Battle): void {
    this.battle = battle;
    this.view = viewOf(battle);
    const a = this.active();
    showMonster(this.playerSprite, a.speciesId, 'back');
    this.playerSprite.setPosition(PLAYER_POS.x, PLAYER_POS.y).setAlpha(a.fainted ? 0 : 1);
    showMonster(this.enemySprite, battle.enemy.speciesId, 'front');
    this.enemySprite.setPosition(ENEMY_POS.x, ENEMY_POS.y).setAlpha(battle.enemy.fainted ? 0 : 1);
    this.enemyInfo.show(battle.enemy);
    this.playerInfo.show(a);
  }

  private sprite(side: Side): Phaser.GameObjects.Sprite {
    return side === 'player' ? this.playerSprite : this.enemySprite;
  }

  private info(side: Side): InfoBox {
    return side === 'player' ? this.playerInfo : this.enemyInfo;
  }
}
