import Phaser from 'phaser';
import { SCENES } from '../config';
import { fadeTo } from '../fx/transitions';
import { api } from '../services';

/** Depois do login: retoma a batalha em andamento, pede o inicial ou vai para o menu. */
export async function routeHome(scene: Phaser.Scene): Promise<void> {
  const battle = await api.activeBattle();
  if (battle) {
    fadeTo(scene, SCENES.battle, { battle });
    return;
  }
  const roster = await api.roster();
  if (roster.team.length + roster.box.length === 0) fadeTo(scene, SCENES.starter);
  else fadeTo(scene, SCENES.hub, { roster });
}
