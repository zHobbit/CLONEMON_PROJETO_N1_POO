package br.clonemon.domain;

import java.util.List;

/** Treinador do mapa, com time fixo. Cada desafio comeca com o time novo, de HP e PP cheios. */
public record NpcTrainer(String id, String name, List<Member> team) {

    /** Um monstro do time: especie e nivel. */
    public record Member(Species species, int level) {}

    public NpcTrainer {
        if (team.isEmpty()) throw new IllegalArgumentException("NPC without team: " + id);
        team = List.copyOf(team);
    }

    public List<Monster> freshTeam() {
        return team.stream().map(m -> new Monster(m.species(), m.level())).toList();
    }
}
