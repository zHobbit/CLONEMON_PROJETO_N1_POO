package br.clonemon.domain;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.within;

class MoveEffectTest {

    @Test
    void movesWithoutEffectKeepTheOriginalConstructor() {
        Move m = new Move("Cuspe", Element.AGUA, 40, 100, 25);
        assertThat(m.effect()).isEqualTo(MoveEffect.NONE);
        assertThat(m.isDamaging()).isTrue();
        assertThat(new Move("x", Element.AGUA, 0, 100, 5, MoveEffect.raise(Stat.DEF, 1)).isDamaging()).isFalse();
        assertThatThrownBy(() -> new Move("x", Element.AGUA, 40, 100, 5, null)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void factoriesBuildConsistentEffects() {
        assertThat(MoveEffect.inflict(StatusCondition.BURN, 30)).isEqualTo(new MoveEffect(MoveEffect.Kind.BURN, 30, null, 0));
        assertThat(MoveEffect.inflict(StatusCondition.NONE, 30)).isEqualTo(MoveEffect.NONE);
        assertThat(MoveEffect.raise(Stat.ATK, 2)).isEqualTo(new MoveEffect(MoveEffect.Kind.RAISE, 100, Stat.ATK, 2));
        assertThat(MoveEffect.lower(Stat.SPD, 1, 30).stages()).isEqualTo(1);
    }

    @Test
    void statusOnlyForStatusEffects() {
        assertThat(MoveEffect.inflict(StatusCondition.SLEEP, 100).status()).isEqualTo(StatusCondition.SLEEP);
        assertThat(MoveEffect.inflict(StatusCondition.FREEZE, 10).status()).isEqualTo(StatusCondition.FREEZE);
        assertThat(MoveEffect.inflict(StatusCondition.PARALYSIS, 10).status()).isEqualTo(StatusCondition.PARALYSIS);
        assertThat(MoveEffect.raise(Stat.ATK, 1).status()).isEqualTo(StatusCondition.NONE);
        assertThat(MoveEffect.NONE.status()).isEqualTo(StatusCondition.NONE);
    }

    @ParameterizedTest
    @CsvSource(nullValues = "null", value = {
            "NONE, 10, null, 0",
            "NONE, 0, ATK, 0",
            "BURN, 0, null, 0",
            "BURN, 101, null, 0",
            "BURN, 30, ATK, 0",
            "RAISE, 100, null, 1",
            "RAISE, 100, ATK, 0",
            "LOWER, 100, DEF, 7",
            "null, 0, null, 0"})
    void rejectsInconsistentEffects(MoveEffect.Kind kind, int chance, Stat stat, int stages) {
        assertThatThrownBy(() -> new MoveEffect(kind, chance, stat, stages)).isInstanceOf(IllegalArgumentException.class);
    }

    @ParameterizedTest
    @CsvSource({"0, 1.0", "1, 1.5", "2, 2.0", "6, 4.0", "-1, 0.6667", "-2, 0.5", "-6, 0.25"})
    void stageMultipliersFollowTheClassicTable(int stage, double expected) {
        assertThat(Stat.multiplier(stage)).isCloseTo(expected, within(0.001));
    }

    @Test
    void stageOutOfRangeIsRejected() {
        assertThatThrownBy(() -> Stat.multiplier(7)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> Stat.multiplier(-7)).isInstanceOf(IllegalArgumentException.class);
    }
}
