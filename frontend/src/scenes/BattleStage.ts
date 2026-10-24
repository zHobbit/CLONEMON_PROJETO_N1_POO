import Phaser from 'phaser';
import type { Battle, Combatant, StatusCondition, TurnEvent } from '../api/types';
import { C, PALETTE } from '../art/palette';
import { BATTLE_BG } from '../art/scenery';
import { BG, addMonster, elementKey, showMonster } from '../art/textures';
import { STATUS_BADGE } from '../battle/labels';
import type { Side, Step } from '../battle/playback';
import { COLORS, CSS, WIDTH } from '../config';
import { BattleFx } from '../fx/BattleFx';
import { HpBar } from '../ui/HpBar';
import { formatHp, hpChangeLabel } from '../ui/hp';
import { addFrame, addText, tween } from '../ui/widgets';

/** De que lado a arena e vista: o normal ('player') ou espelhado ('enemy', so no replay). */
export type Perspective = 'player' | 'enemy';

/** Passos que mexem na arena; texto e espera ficam com a cena (ao vivo espera a seta, o replay espera o tempo). */
export type VisualStep = Exclude<Step, { kind: 'text' } | { kind: 'wait' }>;

type Slot = 'near' | 'far';

const LUNGE = 8;

/** Perto: embaixo a esquerda, de costas, caixa com numeros de HP. Longe: em cima a direita, de frente. */
const SLOTS = {
  near: { x: BATTLE_BG.player.x, y: BATTLE_BG.player.y - 20, view: 'back', enterX: -40, lunge: 1, box: { x: 120, y: 70, numbers: true }, balls: { x: 227, y: 66 } },
  far: { x: BATTLE_BG.enemy.x, y: BATTLE_BG.enemy.y - 20, view: 'front', enterX: WIDTH + 40, lunge: -1, box: { x: 4, y: 6, numbers: false }, balls: { x: 111, y: 35 } },
} as const;

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

  get hp(): number {
    return this.bar.value;
  }

  get maxHp(): number {
    return this.max;
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

/** Bolinhas do time do treinador perto da caixa dele: vermelhas de pe, cinzas desmaiadas. Selvagem: nada. */
function drawTeamBalls(g: Phaser.GameObjects.Graphics, battle: Battle, origin: { x: number; y: number }): void {
  g.clear();
  const size = battle.npcId ? (battle.enemyTeamSize ?? 0) : 0;
  const active = battle.enemyActive ?? 0;
  for (let i = 0; i < size; i++) {
    const down = i < active || (i === active && battle.enemy.fainted);
    const x = origin.x - (size - 1 - i) * 7;
    g.fillStyle(COLORS.frame);
    g.fillCircle(x, origin.y, 3);
    g.fillStyle(down ? COLORS.shadow : COLORS.accent);
    g.fillCircle(x, origin.y, 2);
  }
}

function lead(battle: Battle): Combatant {
  return battle.playerTeam[battle.playerActive];
}

/** A arena da batalha: fundo, sprites, caixas de informacoes e as animacoes de cada passo. */
export class BattleStage {
  readonly fx: BattleFx;
  private readonly sprites: Record<Slot, Phaser.GameObjects.Sprite>;
  private readonly boxes: Record<Slot, InfoBox>;
  private readonly balls: Phaser.GameObjects.Graphics;
  private perspective: Perspective = 'player';
  private battle: Battle;
  /** Estado depois do turno animado: de onde vem o proximo monstro do oponente. */
  private after: Battle | null = null;

  constructor(private readonly scene: Phaser.Scene, battle: Battle) {
    this.fx = new BattleFx(scene);
    this.battle = battle;
    scene.add.image(0, 0, BG.battle).setOrigin(0);
    this.sprites = {
      far: addMonster(scene, SLOTS.far.x, SLOTS.far.y, battle.enemy.speciesId, 'front'),
      near: addMonster(scene, SLOTS.near.x, SLOTS.near.y, lead(battle).speciesId, 'back'),
    };
    this.boxes = {
      far: new InfoBox(scene, SLOTS.far.box.x, SLOTS.far.box.y, 116, SLOTS.far.box.numbers),
      near: new InfoBox(scene, SLOTS.near.box.x, SLOTS.near.box.y, 116, SLOTS.near.box.numbers),
    };
    this.balls = scene.add.graphics();
    this.show(battle);
  }

  private slot(side: Side): Slot {
    return (side === 'player') === (this.perspective === 'player') ? 'near' : 'far';
  }

  sprite(side: Side): Phaser.GameObjects.Sprite {
    return this.sprites[this.slot(side)];
  }

  /** Posicao de descanso do sprite de um lado. */
  home(side: Side): { x: number; y: number } {
    const s = SLOTS[this.slot(side)];
    return { x: s.x, y: s.y };
  }

  /** X fora da tela de onde o monstro de um lado entra. */
  entryX(side: Side): number {
    return SLOTS[this.slot(side)].enterX;
  }

  private box(side: Side): InfoBox {
    return this.boxes[this.slot(side)];
  }

  /** Espelha a arena (replay) e redesenha o estado atual. */
  setPerspective(p: Perspective): void {
    this.perspective = p;
    this.show(this.battle);
  }

  /** Alinha a tela com um estado, sem animar. */
  show(battle: Battle): void {
    this.battle = battle;
    this.after = null;
    for (const side of ['player', 'enemy'] as const) {
      const m = side === 'player' ? lead(battle) : battle.enemy;
      const slot = this.slot(side);
      showMonster(this.sprites[slot], m.speciesId, SLOTS[slot].view);
      this.sprites[slot].setPosition(SLOTS[slot].x, SLOTS[slot].y).setAlpha(m.fainted ? 0 : 1);
      this.boxes[slot].show(m);
    }
    drawTeamBalls(this.balls, battle, SLOTS[this.slot('enemy')].balls);
  }

  /** Antes de animar um turno: `before` e o que esta na tela, `after` o estado no fim do turno. */
  beginTurn(before: Battle, after: Battle, events: TurnEvent[]): void {
    this.battle = before;
    this.after = after;
    this.fx.beginTurn(before, { events, battle: after });
  }

  play(step: VisualStep): Promise<void> {
    switch (step.kind) {
      case 'attack': {
        // Investida na direcao do oponente: de perto sobe para a direita, de longe desce para a esquerda.
        const dir = SLOTS[this.slot(step.side)].lunge;
        const s = this.sprite(step.side);
        return tween(this.scene, { targets: s, x: s.x + dir * LUNGE, y: s.y - (dir * LUNGE) / 2, duration: 90, yoyo: true, ease: 'Quad.Out' });
      }
      case 'flash':
        this.fx.hit(step.side, this.sprite(step.side));
        return tween(this.scene, { targets: this.sprite(step.side), alpha: 0, duration: 70, yoyo: true, repeat: 2 });
      case 'hp': {
        this.fx.hp(step.side);
        const box = this.box(step.side);
        this.floatHpChange(step.side, hpChangeLabel(box.hp, step.to, box.maxHp));
        return box.setHp(step.to, true);
      }
      case 'enemySwitch':
        return this.enemySwitch(step.hp);
      case 'faint': {
        this.fx.faint(step.side);
        if (step.side === 'enemy') {
          drawTeamBalls(this.balls, { ...this.battle, enemy: { ...this.battle.enemy, fainted: true } }, SLOTS[this.slot('enemy')].balls);
        }
        const s = this.sprite(step.side);
        return tween(this.scene, { targets: s, y: s.y + 24, alpha: 0, duration: 400, ease: 'Quad.In' });
      }
      case 'switch':
        return this.switchTo(step.teamIndex, step.hp);
      case 'status':
        this.box(step.side).setStatus(step.status);
        return Promise.resolve();
      case 'stat': {
        const s = this.sprite(step.side);
        return tween(this.scene, { targets: s, y: s.y + (step.up ? -3 : 3), duration: 90, yoyo: true, repeat: 1 });
      }
    }
  }

  /** "-25%" (vermelho) ou "+10%" (verde) sobe e some acima do monstro. */
  private floatHpChange(side: Side, label: string): void {
    if (!label) return;
    const s = this.sprite(side);
    const color = label.startsWith('-') ? CSS.accent : '#38a838';
    const t = addText(this.scene, s.x, s.y - 22, label, { color, stroke: CSS.paper, strokeThickness: 2 }).setOrigin(0.5);
    this.scene.tweens.add({ targets: t, y: t.y - 12, alpha: 0, delay: 300, duration: 700, onComplete: () => t.destroy() });
  }

  private async switchTo(index: number, hp: number): Promise<void> {
    const c = this.battle.playerTeam[index];
    const s = this.sprite('player');
    const slot = SLOTS[this.slot('player')];
    if (s.alpha > 0) await tween(this.scene, { targets: s, x: slot.enterX, alpha: 0, duration: 250 });
    showMonster(s, c.speciesId, slot.view);
    s.setPosition(slot.enterX, slot.y).setAlpha(1);
    this.box('player').show(c, hp);
    await tween(this.scene, { targets: s, x: slot.x, duration: 300, ease: 'Quad.Out' });
  }

  /** O treinador manda o proximo monstro: entra de fora da tela, com a caixa de informacoes nova. */
  private async enemySwitch(hp: number): Promise<void> {
    const next = this.after ?? this.battle;
    const s = this.sprite('enemy');
    const slot = SLOTS[this.slot('enemy')];
    showMonster(s, next.enemy.speciesId, slot.view);
    s.setPosition(slot.enterX, slot.y).setAlpha(1);
    this.box('enemy').show(next.enemy, hp);
    drawTeamBalls(this.balls, { ...next, enemy: { ...next.enemy, fainted: false } }, slot.balls);
    await tween(this.scene, { targets: s, x: slot.x, duration: 400, ease: 'Quad.Out' });
  }
}
