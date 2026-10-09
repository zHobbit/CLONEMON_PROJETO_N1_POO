package br.clonemon.infrastructure.persistence;

import br.clonemon.domain.Element;
import br.clonemon.domain.Move;
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

    protected MoveEntity() {}

    Move toDomain() {
        return new Move(name, element, power, accuracy, maxPp);
    }
}
