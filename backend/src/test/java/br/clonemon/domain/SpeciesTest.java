package br.clonemon.domain;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SpeciesTest {

    private static final Move A = new Move("a", Element.AGUA, 40, 100, 10);
    private static final Move B = new Move("b", Element.AGUA, 60, 100, 10);
    private static final Move C = new Move("c", Element.AGUA, 80, 100, 10);

    private static Species species(List<Move> moves, List<Integer> levels) {
        return new Species(99, "Teste", Element.AGUA, 40, 40, 40, 40, moves, levels);
    }

    @Test
    void legacyConstructorLearnsEverythingAtLevelOne() {
        Species s = new Species(99, "Teste", Element.AGUA, 40, 40, 40, 40, List.of(A, B));
        assertThat(s.learnLevels()).containsExactly(1, 1);
        assertThat(s.knownMoveCount(1)).isEqualTo(2);
    }

    @Test
    void knownMovesGrowWithLevel() {
        Species s = species(List.of(A, B, C), List.of(1, 5, 5));
        assertThat(s.knownMoveCount(1)).isEqualTo(1);
        assertThat(s.knownMoveCount(4)).isEqualTo(1);
        assertThat(s.knownMoveCount(5)).isEqualTo(3);
        assertThat(Catalog.GROOT.knownMoveCount(11)).isEqualTo(3);
    }

    @Test
    void rejectsInvalidLearnsets() {
        assertThatThrownBy(() -> species(List.of(), List.of())).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> species(List.of(A, B), List.of(1))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> species(List.of(A, B), List.of(2, 3)))
                .as("o primeiro golpe precisa ser do nivel 1").isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> species(List.of(A, B, C), List.of(1, 9, 7)))
                .as("fora da ordem de aprendizado").isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> species(List.of(A, B), List.of(1, 51))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> species(List.of(A, B, C, A, B), List.of(1, 1, 1, 1, 1)))
                .as("o menu so mostra 4 golpes").isInstanceOf(IllegalArgumentException.class);
    }
}
