package br.clonemon.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ExperienceCurveTest {

    @Test
    void levelChangesExactlyAtThreshold() {
        assertThat(ExperienceCurve.levelFor(ExperienceCurve.xpForLevel(10) - 1)).isEqualTo(9);
        assertThat(ExperienceCurve.levelFor(ExperienceCurve.xpForLevel(10))).isEqualTo(10);
    }

    @Test
    void levelIsCappedAtMax() {
        assertThat(ExperienceCurve.levelFor(Integer.MAX_VALUE)).isEqualTo(ExperienceCurve.MAX_LEVEL);
        Monster m = new Monster(Catalog.GROOT, ExperienceCurve.MAX_LEVEL);
        m.gainXp(100_000);
        assertThat(m.xp()).isEqualTo(ExperienceCurve.xpForLevel(ExperienceCurve.MAX_LEVEL));
    }

    @Test
    void zeroXpIsLevelOne() {
        assertThat(ExperienceCurve.levelFor(0)).isEqualTo(1);
    }
}
