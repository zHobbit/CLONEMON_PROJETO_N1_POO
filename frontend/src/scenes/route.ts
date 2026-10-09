import Phaser from 'phaser';
import { SCENES } from '../config';
import { api } from '../services';

/** Depois do login: retoma a batalha em andamento, pede o inicial ou vai para o menu. */
export async function routeHome(scene: Phaser.Scene): Promise<void> {
  const battle = await api.activeBattle();
  if (battle) {
    scene.scene.start(SCENES.battle, { battle });
    return;
  }
  const roster = await api.roster();
  if (roster.team.length + roster.box.length === 0) scene.scene.start(SCENES.starter);
  else scene.scene.start(SCENES.hub, { roster });
}
