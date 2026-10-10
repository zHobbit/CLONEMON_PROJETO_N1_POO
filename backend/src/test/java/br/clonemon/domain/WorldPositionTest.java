package br.clonemon.domain;

import br.clonemon.domain.WorldPosition.Facing;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class WorldPositionTest {

    @Test
    void acceptsTheWholeMap() {
        assertThat(new WorldPosition(0, 0, Facing.UP)).extracting(WorldPosition::x, WorldPosition::y).containsExactly(0, 0);
        assertThat(new WorldPosition(199, 199, Facing.RIGHT).facing()).isEqualTo(Facing.RIGHT);
    }

    @ParameterizedTest
    @CsvSource({"-1, 0", "0, -1", "200, 0", "0, 200"})
    void rejectsPositionsOutsideTheMap(int x, int y) {
        assertThatThrownBy(() -> new WorldPosition(x, y, Facing.DOWN)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void facingIsRequired() {
        assertThatThrownBy(() -> new WorldPosition(1, 1, null)).isInstanceOf(IllegalArgumentException.class);
    }
}
