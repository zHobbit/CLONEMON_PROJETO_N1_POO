package br.clonemon.infrastructure.persistence;

import br.clonemon.domain.Element;
import br.clonemon.domain.Species;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

import java.util.List;

/** Dados estaticos, populados pela migration V2. */
@Entity
@Table(name = "species")
class SpeciesEntity {
    @Id
    private Long id;

    @Column(nullable = false, length = 40)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Element element;

    @Column(name = "base_hp")
    private int baseHp;
    @Column(name = "base_atk")
    private int baseAtk;
    @Column(name = "base_def")
    private int baseDef;
    @Column(name = "base_spd")
    private int baseSpd;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "species_move",
            joinColumns = @JoinColumn(name = "species_id"),
            inverseJoinColumns = @JoinColumn(name = "move_id"))
    @OrderColumn(name = "slot")
    private List<MoveEntity> moves;

    protected SpeciesEntity() {}

    Species toDomain() {
        return new Species(id, name, element, baseHp, baseAtk, baseDef, baseSpd,
                moves.stream().map(MoveEntity::toDomain).toList());
    }
}
