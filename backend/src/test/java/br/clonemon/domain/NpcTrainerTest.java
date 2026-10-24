package br.clonemon.domain;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Regras de montagem do time de um treinador: variedade para ninguem vencer so pela vantagem de elemento. */
class NpcTrainerTest {

    private static NpcTrainer.Member lv5(Species s) { return new NpcTrainer.Member(s, 5); }

    private static Species copyOf(Species s, long id, String name) {
        return new Species(id, name, s.element(), s.baseHp(), s.baseAtk(), s.baseDef(), s.baseSpd(), s.moves());
    }

    @Test
    void acceptsAtMostTwoOfTheSameElement() {
        assertThatCode(() -> new NpcTrainer("ok", "OK", List.of(lv5(Catalog.LINDOYA), lv5(Catalog.BOTO), lv5(Catalog.COISO))))
                .doesNotThrowAnyException();
        Species thirdWater = copyOf(Catalog.LINDOYA, 99, "Aguinha");
        assertThatThrownBy(() -> new NpcTrainer("x", "X", List.of(lv5(Catalog.LINDOYA), lv5(Catalog.BOTO), lv5(thirdWater))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("AGUA");
    }

    @Test
    void rejectsTheSameSpeciesTwice() {
        assertThatThrownBy(() -> new NpcTrainer("x", "X", List.of(lv5(Catalog.COISO), lv5(Catalog.COISO))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Coiso");
    }
}
