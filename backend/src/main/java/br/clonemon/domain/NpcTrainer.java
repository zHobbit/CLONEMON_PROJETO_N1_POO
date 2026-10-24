package br.clonemon.domain;

import java.util.EnumMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Treinador do mapa, com time fixo. Cada desafio comeca com o time novo, de HP e PP cheios.
 * O time precisa de variedade: no maximo {@value #MAX_PER_ELEMENT} do mesmo elemento e nenhuma especie repetida,
 * para nenhum treinador vencer so pela vantagem de elemento.
 */
public record NpcTrainer(String id, String name, List<Member> team) {

    public static final int MAX_PER_ELEMENT = 2;

    /** Um monstro do time: especie e nivel. */
    public record Member(Species species, int level) {}

    public NpcTrainer {
        if (team.isEmpty()) throw new IllegalArgumentException("NPC without team: " + id);
        team = List.copyOf(team);
        Set<Long> species = new HashSet<>();
        Map<Element, Integer> perElement = new EnumMap<>(Element.class);
        for (Member m : team) {
            if (!species.add(m.species().id()))
                throw new IllegalArgumentException("NPC " + id + " repeats species " + m.species().name());
            if (perElement.merge(m.species().element(), 1, Integer::sum) > MAX_PER_ELEMENT)
                throw new IllegalArgumentException("NPC " + id + " has more than " + MAX_PER_ELEMENT + " of element "
                        + m.species().element());
        }
    }

    public List<Monster> freshTeam() {
        return team.stream().map(m -> new Monster(m.species(), m.level())).toList();
    }
}
