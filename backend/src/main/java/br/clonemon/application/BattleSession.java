package br.clonemon.application;

import br.clonemon.domain.Battle;

import java.util.List;

/** Batalha em andamento; {@code playerMonsterIds[i]} e o monstro salvo correspondente a {@code battle.playerTeam()[i]}. */
public record BattleSession(Long id, long trainerId, List<Long> playerMonsterIds, Battle battle) {
    public BattleSession {
        playerMonsterIds = List.copyOf(playerMonsterIds);
    }
}
