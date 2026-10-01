package br.clonemon.domain;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;

import static org.assertj.core.api.Assertions.assertThat;

class ElementTest {

    @ParameterizedTest
    @CsvSource({"AGUA,ROCHA", "ROCHA,FOGO", "FOGO,GELO", "GELO,GRAMA", "GRAMA,RAIO", "RAIO,AGUA"})
    void attackerIsStrongAgainstNextInCycle(Element atk, Element def) {
        assertThat(atk.effectivenessAgainst(def)).isEqualTo(Element.STRONG);
        assertThat(def.effectivenessAgainst(atk)).isEqualTo(Element.WEAK);
    }

    @ParameterizedTest
    @EnumSource(Element.class)
    void sameElementIsNeutral(Element e) {
        assertThat(e.effectivenessAgainst(e)).isEqualTo(Element.NEUTRAL);
    }

    @Test
    void nonAdjacentElementsAreNeutral() {
        assertThat(Element.AGUA.effectivenessAgainst(Element.GELO)).isEqualTo(Element.NEUTRAL);
        assertThat(Element.FOGO.effectivenessAgainst(Element.RAIO)).isEqualTo(Element.NEUTRAL);
    }
}
