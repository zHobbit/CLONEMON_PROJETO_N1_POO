package br.clonemon.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

/** Linha de {@code species_move}: o golpe e o nivel em que a especie o aprende. */
@Embeddable
class LearnableMove {
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "move_id", nullable = false)
    private MoveEntity move;

    @Column(name = "learn_level", nullable = false)
    private int learnLevel;

    protected LearnableMove() {}

    MoveEntity getMove() { return move; }
    int getLearnLevel() { return learnLevel; }
}
