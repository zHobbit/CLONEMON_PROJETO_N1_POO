package br.clonemon.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MonsterTest {

    @Test
    void startsAtFullHpWithFullPp() {
        Monster m = new Monster(Catalog.LUCIFER, 10);
        assertThat(m.level()).isEqualTo(10);
        assertThat(m.currentHp()).isEqualTo(m.maxHp());
        assertThat(m.ppLeft(0)).isEqualTo(25);
    }

    @Test
    void higherLevelHasHigherStats() {
        Monster low = new Monster(Catalog.GROOT, 5);
        Monster high = new Monster(Catalog.GROOT, 30);
        assertThat(high.maxHp()).isGreaterThan(low.maxHp());
        assertThat(high.attack()).isGreaterThan(low.attack());
    }

    @Test
    void damageAndHealAreClamped() {
        Monster m = new Monster(Catalog.OLAF, 5);
        m.takeDamage(9999);
        assertThat(m.currentHp()).isZero();
        assertThat(m.isFainted()).isTrue();
        m.heal(9999);
        assertThat(m.currentHp()).isEqualTo(m.maxHp());
        m.takeDamage(-5);
        assertThat(m.currentHp()).isEqualTo(m.maxHp());
    }

    @Test
    void usingMoveConsumesPpAndBlocksAtZero() {
        Monster m = new Monster(Catalog.COISO, 5);
        for (int i = 0; i < 10; i++) m.use(1);
        assertThat(m.canUse(1)).isFalse();
        assertThat(m.usableMoves()).containsExactly(0);
        assertThatThrownBy(() -> m.use(1)).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void restoreRebuildsSavedState() {
        Monster original = new Monster(Catalog.LUCIFER, 12);
        original.takeDamage(7);
        original.use(1);
        Monster copy = Monster.restore(Catalog.LUCIFER, original.xp(), original.currentHp(), original.ppSnapshot());
        assertThat(copy.level()).isEqualTo(12);
        assertThat(copy.currentHp()).isEqualTo(original.currentHp());
        assertThat(copy.ppLeft(1)).isEqualTo(9);
    }

    @Test
    void restoreRejectsInconsistentState() {
        assertThatThrownBy(() -> Monster.restore(Catalog.GROOT, 0, 999, new int[]{25, 10}))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> Monster.restore(Catalog.GROOT, 0, 1, new int[]{25}))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> Monster.restore(Catalog.GROOT, 0, 1, new int[]{26, 10}))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void fullRestoreRefillsHpAndPp() {
        Monster m = new Monster(Catalog.OLAF, 8);
        m.takeDamage(10);
        m.use(0);
        m.fullRestore();
        assertThat(m.currentHp()).isEqualTo(m.maxHp());
        assertThat(m.ppLeft(0)).isEqualTo(25);
    }

    @Test
    void gainingXpLevelsUpAndKeepsMissingHp() {
        Monster m = new Monster(Catalog.LINDOYA, 5);
        m.takeDamage(3);
        int gained = m.gainXp(ExperienceCurve.xpForLevel(7) - m.xp());
        assertThat(gained).isEqualTo(2);
        assertThat(m.level()).isEqualTo(7);
        assertThat(m.maxHp() - m.currentHp()).isEqualTo(3);
    }
}
