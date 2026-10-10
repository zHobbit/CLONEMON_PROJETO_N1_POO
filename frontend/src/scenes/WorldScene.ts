import Phaser from 'phaser';
import { ApiError } from '../api/client';
import type { Battle, BattleStatus, Facing, Roster, WorldPosition } from '../api/types';
import { addMenuBackground } from '../art/textures';
import {
  type CharacterId,
  type Direction,
  TILE_SIZE,
  Tile,
  WORLD_TEXTURES,
  characterKey,
  registerWorldArt,
  walkAnimKey,
} from '../art/worldTextures';
import { audio } from '../audio';
import { SCENES, WIDTH } from '../config';
import { FADE_MS, battleTransition, fadeTo } from '../fx/transitions';
import { api } from '../services';
import { Menu } from '../ui/Menu';
import { mapKey } from '../ui/navigation';
import { TextBox } from '../ui/TextBox';
import { addFrame, addText, delay, tween } from '../ui/widgets';
import { rollEncounter } from '../world/encounter';
import { OPPOSITE, ahead, canEnter, cellKey, samePoint, sightDistance, terrainAt } from '../world/grid';
import { type NpcDef, type Point, ROUTE_1, type Terrain, type WorldMap, BUILDING_SHAPE, doorOf } from '../world/maps';
import { PositionSaver } from '../world/saver';

export interface WorldData {
  roster?: Roster | null;
  /** Como terminou a batalha de onde o jogador acabou de voltar. */
  outcome?: { status: BattleStatus; npcId: string | null };
}

/** Duracao de um passo de 16px. */
const STEP_MS = 230;
/** Parado, um toque mais curto que isto so vira o personagem. */
const TURN_MS = 90;
const BUMP_MS = 320;
const EXCLAIM_MS = 650;
/** Capim alto na frente dos personagens; a interface fica acima de tudo. */
const FRONT_DEPTH = 5_000;
const UI_DEPTH = 10_000;

const TEAM_CANT_FIGHT = 'Seus CLONEMONS nao podem lutar agora. Cure-os no CENTRO CLONEMON!';
const CONNECTION_ERROR = 'Erro de conexao. Tente de novo.';

/** Quadro da arte para cada terreno (sob as construcoes fica grama). */
const TILE_OF: Readonly<Record<Terrain, Tile>> = {
  grass: Tile.GRASS,
  tallGrass: Tile.TALL_GRASS,
  path: Tile.PATH,
  water: Tile.WATER,
  tree: Tile.TREE,
  flowers: Tile.FLOWERS,
  fence: Tile.FENCE,
  sign: Tile.SIGN,
  rock: Tile.ROCK,
  sand: Tile.SAND,
  bridge: Tile.BRIDGE,
  building: Tile.GRASS,
};

/** Linha da folha do personagem para cada direcao (coluna 0 = parado). */
const SHEET_ROW: Readonly<Record<Facing, number>> = { DOWN: 0, LEFT: 1, RIGHT: 2, UP: 3 };
const ART_DIR: Readonly<Record<Facing, Direction>> = { UP: 'up', DOWN: 'down', LEFT: 'left', RIGHT: 'right' };
const DIRECTIONS: readonly Facing[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

interface Actor extends Point {
  id: CharacterId;
  facing: Facing;
  sprite: Phaser.GameObjects.Sprite;
}

interface Npc extends Actor {
  def: NpcDef;
}

/**
 * O que so vale nesta aba: a ultima posicao do jogador (mais nova que a salva no servidor)
 * e onde ficaram os treinadores que vieram ate ele.
 */
let session: { user: string | null; position: WorldPosition | null; npcs: Map<string, WorldPosition> } | null = null;

function currentSession(): NonNullable<typeof session> {
  const user = api.username();
  if (session?.user !== user) session = { user, position: null, npcs: new Map() };
  return session;
}

/** Ponto de apoio do personagem: o meio da borda de baixo do ladrilho. */
function feet(p: Point): Point {
  return { x: p.x * TILE_SIZE + TILE_SIZE / 2, y: (p.y + 1) * TILE_SIZE };
}

function standFrame(facing: Facing): number {
  return SHEET_ROW[facing] * 3;
}

/** O mapa: anda pela grade, conversa, le placas, cura no Centro e entra em batalhas. */
export class WorldScene extends Phaser.Scene {
  /** Expostos para os testes E2E: posicao do jogador (null ate carregar) e o time. */
  position: WorldPosition | null = null;
  roster: Roster | null = null;

  private readonly map: WorldMap = ROUTE_1;
  private player!: Actor;
  private npcs: Npc[] = [];
  private defeated = new Set<string>();
  /** Treinadores que desafiaram e nao puderam lutar: so voltam a vigiar quando o jogador sair da frente. */
  private ignoring = new Set<string>();
  private front!: Phaser.Tilemaps.TilemapLayer;
  private frontCells: Point[] = [];
  private keys!: Record<Facing, Phaser.Input.Keyboard.Key>;
  private saver!: PositionSaver;
  /** Dialogo, menu, batalha chegando...: o jogador nao anda nem interage. */
  private busy = true;
  private idleSince = 0;
  private walk: { from: Point; to: Point; t: number } | null = null;
  private turnUntil = 0;
  private lastArrival = -Infinity;
  private nextBump = 0;

  constructor() {
    super(SCENES.world);
  }

  /** Parado e livre para andar (sem dialogo, menu ou batalha chegando). */
  get idle(): boolean {
    return this.position !== null && !this.busy && !this.walk;
  }

  create(data: WorldData = {}): void {
    this.position = null;
    this.roster = null;
    this.npcs = [];
    this.defeated = new Set();
    this.ignoring = new Set();
    this.frontCells = [];
    this.busy = true;
    this.walk = null;
    this.turnUntil = 0;
    this.lastArrival = -Infinity;

    registerWorldArt(this);
    this.drawMap();
    this.saver = new PositionSaver((p) => api.savePosition(p));
    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    // Sem captura: o formulario de login (HTML) continua recebendo setas e espaco.
    this.keys = { UP: kb.addKey(K.UP, false), DOWN: kb.addKey(K.DOWN, false), LEFT: kb.addKey(K.LEFT, false), RIGHT: kb.addKey(K.RIGHT, false) };
    this.listenKeys();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      // Melhor esforco: guarda onde o jogador parou (nada a fazer se ja saiu da conta).
      if (this.position && api.isLoggedIn()) void this.saver.flush(this.position);
    });
    void this.loadWorld(data);
  }

  update(time: number, delta: number): void {
    if (!this.position) return;
    if (this.walk) {
      this.advance(time, delta);
      return;
    }
    if (this.busy) return;
    const dir = this.heldDirection();
    if (!dir) {
      this.standStill(this.player);
      return;
    }
    if (dir !== this.player.facing) {
      this.face(this.player, dir);
      this.track();
      // Parado, um toque rapido so vira; logo depois de um passo, muda de direcao sem parar.
      if (time - this.lastArrival > 50) {
        this.turnUntil = time + TURN_MS;
        return;
      }
    }
    if (time < this.turnUntil) return;
    this.tryWalk(dir, time);
  }

  // ---------------------------------------------------------------- montagem

  private drawMap(): void {
    const { width, height } = this.map;
    const tm = this.make.tilemap({
      data: this.map.terrain.map((row) => row.map((t) => TILE_OF[t])),
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });
    const tiles = tm.addTilesetImage(WORLD_TEXTURES.tiles, WORLD_TEXTURES.tiles, TILE_SIZE, TILE_SIZE, 0, 0);
    if (!tiles) throw new Error('Textura dos ladrilhos ausente');
    tm.createLayer(0, tiles, 0, 0)?.setDepth(-1);
    this.front = (tm.createBlankLayer('front', tiles, 0, 0) as Phaser.Tilemaps.TilemapLayer).setDepth(FRONT_DEPTH);

    for (const b of this.map.buildings) {
      const key = b.kind === 'center' ? WORLD_TEXTURES.center : WORLD_TEXTURES.house;
      // Fica atras de quem esta abaixo da construcao.
      const bottom = (b.y + BUILDING_SHAPE[b.kind].h) * TILE_SIZE;
      this.add.image(b.x * TILE_SIZE, b.y * TILE_SIZE, key).setOrigin(0).setDepth(bottom - 1);
    }
    this.cameras.main.setBounds(0, 0, width * TILE_SIZE, height * TILE_SIZE).setRoundPixels(true);
  }

  private async loadWorld(data: WorldData): Promise<void> {
    const [world, roster] = await Promise.all([
      api.world().catch(() => null),
      data.roster ? Promise.resolve(data.roster) : api.roster().catch(() => null),
    ]);
    if (!this.scene.isActive()) return; // 401: ja fomos para o login
    this.roster = roster;
    for (const id of world?.defeatedNpcs ?? []) this.defeated.add(id);
    const outcome = data.outcome;
    if (outcome?.status === 'PLAYER_WON' && outcome.npcId) this.defeated.add(outcome.npcId);

    const s = currentSession();
    for (const def of this.map.npcs) {
      const at = s.npcs.get(def.id) ?? { x: def.x, y: def.y, facing: def.facing };
      this.npcs.push({ id: def.id, def, ...at, sprite: this.addCharacter(def.id, at) });
    }

    const whiteout = outcome?.status === 'PLAYER_LOST';
    let start = whiteout ? this.centerExit() : (s.position ?? world?.position ?? this.map.spawn);
    // Posicao invalida (mapa mudou, dado velho): volta ao ponto de partida.
    if (!canEnter(this.map, start, this.occupied())) start = this.map.spawn;
    this.player = { id: 'player', ...start, sprite: this.addCharacter('player', start) };
    this.cameras.main.startFollow(this.player.sprite, true, 1, 1, 0, TILE_SIZE / 2);
    this.track();
    this.setGrassFront([start]);

    if (whiteout) await this.whiteout();
    else this.setIdle();
  }

  private addCharacter(id: CharacterId, at: WorldPosition): Phaser.GameObjects.Sprite {
    const p = feet(at);
    return this.add.sprite(p.x, p.y, characterKey(id), standFrame(at.facing)).setOrigin(0.5, 1).setDepth(p.y);
  }

  /** Enter interage (ou abre o menu) e Esc abre o menu, so com o jogador parado e livre. */
  private listenKeys(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    const handled = new WeakSet<KeyboardEvent>();
    const listener = (e: KeyboardEvent) => {
      // A mesma tecla pode chegar de novo (veja ui/input.ts); a que fechou um dialogo nao conta.
      if (handled.has(e)) return;
      handled.add(e);
      if (e.repeat || this.busy || this.walk || !this.position || e.timeStamp <= this.idleSince) return;
      const key = mapKey(e.key);
      if (key === 'confirm') void this.interact();
      else if (key === 'cancel') void this.pause();
    };
    keyboard.on('keydown', listener);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => keyboard.off('keydown', listener));
  }

  // ---------------------------------------------------------------- movimento

  private heldDirection(): Facing | null {
    if (this.keys[this.player.facing].isDown) return this.player.facing;
    return DIRECTIONS.find((d) => this.keys[d].isDown) ?? null;
  }

  /** Comeca um passo; se o caminho estiver bloqueado, anda no lugar com um baque. */
  private tryWalk(dir: Facing, time: number): boolean {
    const from = { x: this.player.x, y: this.player.y };
    const to = ahead(from, dir);
    if (dir === 'UP' && samePoint(to, doorOf(this.center()))) {
      void this.enterCenter();
      return false;
    }
    this.player.sprite.play(walkAnimKey('player', ART_DIR[dir]), true);
    if (!canEnter(this.map, to, this.occupied())) {
      if (time >= this.nextBump) {
        audio.sfx('bump');
        this.nextBump = time + BUMP_MS;
      }
      return false;
    }
    this.walk = { from, to, t: 0 };
    this.setGrassFront([from, to]);
    return true;
  }

  /** Avanca o passo em andamento; segurando a seta, emenda o proximo sem parar. */
  private advance(time: number, delta: number): void {
    const w = this.walk!;
    w.t += delta / STEP_MS;
    const a = feet(w.from);
    const b = feet(w.to);
    const t = Math.min(w.t, 1);
    this.player.sprite.setPosition(Math.round(a.x + (b.x - a.x) * t), Math.round(a.y + (b.y - a.y) * t));
    this.player.sprite.setDepth(this.player.sprite.y);
    if (w.t < 1) return;

    const leftover = (w.t - 1) * STEP_MS;
    this.walk = null;
    this.arrive(w.to, time);
    if (this.busy) {
      this.standStill(this.player);
      return;
    }
    const dir = this.heldDirection();
    if (!dir) {
      this.standStill(this.player);
      return;
    }
    if (dir !== this.player.facing) {
      this.face(this.player, dir);
      this.track();
    }
    if (this.tryWalk(dir, time) && leftover > 0) this.advance(time, leftover);
  }

  private arrive(to: Point, time: number): void {
    this.player.x = to.x;
    this.player.y = to.y;
    this.lastArrival = time;
    this.track();
    this.setGrassFront([to]);
    void this.saver.step(this.position!);

    const spotted = this.spottedBy();
    if (spotted) void this.trainerSpotted(spotted.npc, spotted.distance);
    else if (rollEncounter(terrainAt(this.map, to))) void this.wildBattle();
  }

  /** Primeiro treinador invicto que enxerga o jogador. */
  private spottedBy(): { npc: Npc; distance: number } | null {
    const occupied = this.occupied();
    for (const npc of this.npcs) {
      if (this.defeated.has(npc.def.id)) continue;
      const distance = sightDistance(this.map, { ...npc, sight: npc.def.sight }, this.player, occupied);
      if (distance === null) this.ignoring.delete(npc.def.id);
      else if (!this.ignoring.has(npc.def.id)) return { npc, distance };
    }
    return null;
  }

  private occupied(): Set<string> {
    return new Set(this.npcs.map(cellKey));
  }

  private face(actor: Actor, facing: Facing): void {
    actor.facing = facing;
    actor.sprite.stop();
    actor.sprite.setFrame(standFrame(facing));
  }

  private standStill(actor: Actor): void {
    if (actor.sprite.anims.isPlaying) this.face(actor, actor.facing);
  }

  /** Atualiza a posicao exposta e a da sessao. */
  private track(): void {
    const { x, y, facing } = this.player;
    this.position = { x, y, facing };
    currentSession().position = { ...this.position };
  }

  /** Capim alto desenhado na frente das pernas do jogador (no ladrilho de origem e no de destino). */
  private setGrassFront(cells: Point[]): void {
    for (const c of this.frontCells) this.front.removeTileAt(c.x, c.y);
    this.frontCells = cells.filter((c) => terrainAt(this.map, c) === 'tallGrass');
    for (const c of this.frontCells) this.front.putTileAt(Tile.TALL_GRASS_FRONT, c.x, c.y);
  }

  private placePlayer(at: WorldPosition): void {
    Object.assign(this.player, { x: at.x, y: at.y });
    const p = feet(at);
    this.player.sprite.setPosition(p.x, p.y).setDepth(p.y);
    this.face(this.player, at.facing);
    this.track();
    this.setGrassFront([at]);
  }

  private setIdle(): void {
    this.busy = false;
    this.idleSince = performance.now();
  }

  private flushPosition(): Promise<void> {
    return this.position && api.isLoggedIn() ? this.saver.flush(this.position) : Promise.resolve();
  }

  // ---------------------------------------------------------------- interacoes

  private async interact(): Promise<void> {
    const front = ahead(this.player, this.player.facing);
    const npc = this.npcs.find((n) => samePoint(n, front));
    if (npc) return this.talkTo(npc);
    const sign = this.map.signs.find((s) => samePoint(s, front));
    if (sign) return this.read(sign.text);
    const building = this.map.buildings.find((b) => samePoint(doorOf(b), front));
    if (building?.kind === 'center') return this.enterCenter();
    if (building) return this.read(['A porta esta trancada.']);
    return this.pause();
  }

  private async read(lines: readonly string[]): Promise<void> {
    this.busy = true;
    await this.say(lines);
    this.setIdle();
  }

  /** Menu de pausa: TIME e SAIR (a cura agora e no Centro). */
  private async pause(): Promise<void> {
    this.busy = true;
    this.standStill(this.player);
    const { value: menu, objects } = this.pinned(() => {
      addFrame(this, 166, 0, 74, 40);
      return new Menu(this, [{ label: 'TIME' }, { label: 'SAIR' }], { x: 172, y: 8, cancellable: true });
    });
    const choice = await menu.choose();
    menu.destroy();
    for (const o of objects) o.destroy();
    if (choice === 0) {
      void this.flushPosition();
      fadeTo(this, SCENES.team, { roster: this.roster });
    } else if (choice === 1) {
      await this.flushPosition();
      api.logout();
      session = null;
      fadeTo(this, SCENES.title);
    } else {
      this.setIdle();
    }
  }

  private async talkTo(npc: Npc): Promise<void> {
    this.busy = true;
    this.face(npc, OPPOSITE[this.player.facing]);
    this.remember(npc);
    if (this.defeated.has(npc.def.id)) {
      await this.read(npc.def.after);
      return;
    }
    await this.challenge(npc);
  }

  /** O treinador viu o jogador: "!", vem ate ele e desafia. */
  private async trainerSpotted(npc: Npc, distance: number): Promise<void> {
    this.busy = true;
    this.standStill(this.player);
    const bubble = this.add
      .image(npc.sprite.x, npc.sprite.y - npc.sprite.height, WORLD_TEXTURES.exclaim)
      .setOrigin(0.5, 1)
      .setDepth(FRONT_DEPTH + 1);
    audio.sfx('alert');
    await tween(this, { targets: bubble, y: bubble.y - 3, duration: 100, yoyo: true });
    await delay(this, EXCLAIM_MS);
    bubble.destroy();
    await this.walkNpc(npc, distance - 1);
    this.face(this.player, OPPOSITE[npc.facing]);
    this.track();
    await this.challenge(npc);
  }

  private async walkNpc(npc: Npc, steps: number): Promise<void> {
    if (steps <= 0) return;
    npc.sprite.play(walkAnimKey(npc.id, ART_DIR[npc.facing]), true);
    for (let i = 0; i < steps; i++) {
      const next = ahead(npc, npc.facing);
      const p = feet(next);
      await tween(this, {
        targets: npc.sprite,
        x: p.x,
        y: p.y,
        duration: STEP_MS,
        onUpdate: () => npc.sprite.setDepth(npc.sprite.y),
      });
      npc.x = next.x;
      npc.y = next.y;
    }
    this.face(npc, npc.facing);
    this.remember(npc);
  }

  /** O treinador fica onde parou ate o fim da sessao. */
  private remember(npc: Npc): void {
    currentSession().npcs.set(npc.def.id, { x: npc.x, y: npc.y, facing: npc.facing });
  }

  private async challenge(npc: Npc): Promise<void> {
    this.busy = true;
    await this.say(npc.def.before);
    try {
      await this.enterBattle(await api.startBattle(npc.def.id));
    } catch (e) {
      if (!this.scene.isActive()) return;
      let lines: readonly string[] = [e instanceof ApiError ? 'Algo deu errado. Tente de novo.' : CONNECTION_ERROR];
      if (e instanceof ApiError && e.status === 409) {
        // Ja vencido (o servidor sabe melhor) ou time sem condicoes de lutar.
        const world = await api.world().catch(() => null);
        if (world?.defeatedNpcs.includes(npc.def.id)) {
          this.defeated.add(npc.def.id);
          lines = npc.def.after;
        } else {
          lines = [TEAM_CANT_FIGHT];
        }
      }
      await this.say(lines);
      this.ignoring.add(npc.def.id);
      this.setIdle();
    }
  }

  private async wildBattle(): Promise<void> {
    this.busy = true;
    this.standStill(this.player);
    try {
      await this.enterBattle(await api.startBattle());
    } catch (e) {
      if (!this.scene.isActive()) return;
      await this.say([e instanceof ApiError && e.status === 409 ? TEAM_CANT_FIGHT : CONNECTION_ERROR]);
      this.setIdle();
    }
  }

  private async enterBattle(battle: Battle): Promise<void> {
    void this.flushPosition();
    await battleTransition(this);
    this.scene.start(SCENES.battle, { battle });
  }

  private center() {
    return this.map.buildings.find((b) => b.kind === 'center')!;
  }

  /** Na frente da porta do Centro, olhando para baixo. */
  private centerExit(): WorldPosition {
    const door = doorOf(this.center());
    return { x: door.x, y: door.y + 1, facing: 'DOWN' };
  }

  /** Entra no Centro: a enfermeira cura o time e o jogador sai pela porta. */
  private async enterCenter(): Promise<void> {
    this.busy = true;
    this.standStill(this.player);
    await this.fade('out');
    const { objects } = this.pinned(() => {
      addMenuBackground(this);
      addFrame(this, 48, 24, WIDTH - 96, 24);
      addText(this, WIDTH / 2, 32, 'CENTRO CLONEMON').setOrigin(0.5, 0);
    });
    await this.fade('in');
    await this.heal(
      ['Bem-vindo ao CENTRO CLONEMON!', 'Vou cuidar dos seus CLONEMONS. Um momento...'],
      ['Pronto! Seus CLONEMONS estao em plena forma.', 'Volte sempre!'],
    );
    await this.fade('out');
    for (const o of objects) o.destroy();
    this.placePlayer(this.centerExit());
    void this.flushPosition();
    await this.fade('in');
    this.setIdle();
  }

  /** Perdeu a batalha: acorda na frente do Centro com o time curado. */
  private async whiteout(): Promise<void> {
    this.busy = true;
    await this.heal(
      ['Seus CLONEMONS desmaiaram...', 'Voce correu de volta para o CENTRO CLONEMON.'],
      ['Seus CLONEMONS foram curados. Cuidado la fora!'],
    );
    void this.flushPosition();
    this.setIdle();
  }

  private async heal(before: readonly string[], after: readonly string[]): Promise<void> {
    await this.say(before);
    try {
      this.roster = await api.heal();
      audio.sfx('heal');
      await delay(this, 900);
      await this.say(after);
    } catch {
      if (this.scene.isActive()) await this.say([CONNECTION_ERROR]);
    }
  }

  // ---------------------------------------------------------------- interface

  /** Caixa de texto presa a tela, que some no fim da conversa. */
  private async say(lines: readonly string[]): Promise<void> {
    const { value: box, objects } = this.pinned(() => new TextBox(this));
    for (const line of lines) await box.sayAndWait(line);
    this.tweens.killTweensOf(objects);
    for (const o of objects) o.destroy();
  }

  /** Cria elementos de interface fixos na tela (a camera segue o jogador) e acima do mapa. */
  private pinned<T>(make: () => T): { value: T; objects: Phaser.GameObjects.GameObject[] } {
    const before = new Set(this.children.list);
    const value = make();
    const objects = this.children.list.filter((o) => !before.has(o));
    for (const o of objects) {
      (o as unknown as Phaser.GameObjects.Components.ScrollFactor).setScrollFactor(0);
      (o as unknown as Phaser.GameObjects.Components.Depth).setDepth(UI_DEPTH);
    }
    return { value, objects };
  }

  private fade(dir: 'in' | 'out'): Promise<void> {
    const cam = this.cameras.main;
    return new Promise((resolve) => {
      const done = dir === 'out' ? Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE : Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE;
      cam.once(done, () => resolve());
      if (dir === 'out') cam.fadeOut(FADE_MS, 0, 0, 0);
      else cam.fadeIn(FADE_MS, 0, 0, 0);
    });
  }
}
