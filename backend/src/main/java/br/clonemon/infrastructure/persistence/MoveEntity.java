package br.clonemon.infrastructure.persistence;

import br.clonemon.domain.Element;
import br.clonemon.domain.Move;
import br.clonemon.domain.MoveEffect;
import br.clonemon.domain.Stat;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "move")
class MoveEntity {
    @Id
    private Long id;

    @Column(nullable = false, length = 40)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Element element;

    private int power;
    private int accuracy;

    @Column(name = "max_pp")
    private int maxPp;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private MoveEffect.Kind effect;

    @Column(name = "effect_chance")
    private int effectChance;

    @Enumerated(EnumType.STRING)
    @Column(name = "effect_stat", length = 3)
    private Stat effectStat;

    @Column(name = "effect_stages")
    private int effectStages;

    protected MoveEntity() {}

    Move toDomain() {
        return new Move(name, element, power, accuracy, maxPp, new MoveEffect(effect, effectChance, effectStat, effectStages));
    }
}
