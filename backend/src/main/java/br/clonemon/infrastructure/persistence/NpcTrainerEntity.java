package br.clonemon.infrastructure.persistence;

import br.clonemon.domain.NpcTrainer;
import br.clonemon.domain.Species;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

import java.util.List;
import java.util.function.LongFunction;

/** Dados estaticos, populados pela migration V6. */
@Entity
@Table(name = "npc_trainer")
class NpcTrainerEntity {
    @Id
    @Column(length = 20)
    private String id;

    @Column(nullable = false, length = 20)
    private String name;

    /** Time na ordem do slot, que e a ordem em que os monstros entram em campo. */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "npc_team", joinColumns = @JoinColumn(name = "npc_id"))
    @OrderColumn(name = "slot")
    private List<Member> team;

    @Embeddable
    static class Member {
        @Column(name = "species_id", nullable = false)
        private long speciesId;

        @Column(nullable = false)
        private int level;

        protected Member() {}
    }

    protected NpcTrainerEntity() {}

    NpcTrainer toDomain(LongFunction<Species> species) {
        return new NpcTrainer(id, name,
                team.stream().map(m -> new NpcTrainer.Member(species.apply(m.speciesId), m.level)).toList());
    }
}
