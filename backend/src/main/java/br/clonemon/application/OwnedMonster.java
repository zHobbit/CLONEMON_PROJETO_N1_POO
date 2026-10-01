package br.clonemon.application;

import br.clonemon.domain.Monster;

/** Monstro pertencente a um treinador. {@code teamSlot} nulo significa que esta guardado no PC. */
public record OwnedMonster(Long id, long trainerId, String nickname, Integer teamSlot, Monster monster) {

    public static final int TEAM_SIZE = 6;

    public boolean inTeam() { return teamSlot != null; }

    public OwnedMonster withTeamSlot(Integer slot) {
        return new OwnedMonster(id, trainerId, nickname, slot, monster);
    }

    public OwnedMonster withMonster(Monster m) {
        return new OwnedMonster(id, trainerId, nickname, teamSlot, m);
    }
}
