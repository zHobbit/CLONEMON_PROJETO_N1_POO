package br.clonemon.domain;

import org.junit.jupiter.api.Test;

import java.util.Map;

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
        assertThatThrownBy(() -> Monster.restore(Catalog.GROOT, 0, 1, new int[]{25, 10, 15}))
                .as("nivel 1 ainda nao conhece o terceiro golpe").isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> Monster.restore(Catalog.GROOT, 0, 1, new int[]{26, 10}))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> Monster.restore(Catalog.GROOT, -1, 1, new int[]{25, 10}))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void restoreGivesFullPpForMovesMissingFromOlderSaves() {
        // Save de antes dos golpes por nivel: monstro no nivel 12 com PP so dos 2 golpes originais.
        Monster m = Monster.restore(Catalog.LUCIFER, ExperienceCurve.xpForLevel(12), 10, new int[]{20, 3});
        assertThat(m.moves()).hasSize(4);
        assertThat(m.ppSnapshot()).containsExactly(20, 3, 15, 15);
    }

    @Test
    void knowsOnlyMovesLearnedUpToItsLevel() {
        assertThat(new Monster(Catalog.LUCIFER, 5).moves()).extracting(Move::name).containsExactly("Molotov", "Fogo na Babilonia");
        assertThat(new Monster(Catalog.LUCIFER, 7).moves()).extracting(Move::name).endsWith("Churrasco grego").hasSize(3);
        Monster grown = new Monster(Catalog.LUCIFER, 12);
        assertThat(grown.moves()).extracting(Move::name).endsWith("Sangue nos olhos").hasSize(4);
        assertThat(grown.ppSnapshot()).containsExactly(25, 10, 15, 15);
    }

    @Test
    void levelingUpLearnsNewMovesWithFullPp() {
        Monster m = new Monster(Catalog.OLAF, 5);
        m.use(0);
        m.gainXp(ExperienceCurve.xpForLevel(7) - m.xp());
        assertThat(m.moves()).extracting(Move::name).containsExactly("Cubo de gelo", "Fica frio ai", "Frio na barriga");
        assertThat(m.ppSnapshot()).containsExactly(24, 10, 15);
        assertThat(m.canUse(2)).isTrue();

        m.gainXp(ExperienceCurve.xpForLevel(13) - m.xp());
        assertThat(m.moves()).hasSize(4);
        assertThat(m.ppLeft(3)).isEqualTo(10);
    }

    @Test
    void fullRestoreRefillsLearnedMoves() {
        Monster m = new Monster(Catalog.GROOT, 12);
        m.use(3);
        m.fullRestore();
        assertThat(m.ppLeft(3)).isEqualTo(10);
    }

    // --- Estado de batalha ---

    @Test
    void holdsOneStatusAtATime() {
        Monster m = new Monster(Catalog.LINDOYA, 10);
        assertThat(m.status()).isEqualTo(StatusCondition.NONE);
        m.inflict(StatusCondition.PARALYSIS, 0);
        assertThat(m.status()).isEqualTo(StatusCondition.PARALYSIS);
        assertThat(m.canGet(StatusCondition.BURN)).isFalse();
        assertThatThrownBy(() -> m.inflict(StatusCondition.BURN, 0)).isInstanceOf(IllegalStateException.class);
        m.cure();
        assertThat(m.canGet(StatusCondition.BURN)).isTrue();
    }

    @Test
    void elementIsImmuneToItsOwnStatus() {
        assertThat(new Monster(Catalog.LUCIFER, 10).canGet(StatusCondition.BURN)).isFalse();
        assertThat(new Monster(Catalog.OLAF, 10).canGet(StatusCondition.FREEZE)).isFalse();
        assertThat(new Monster(Catalog.ELETROPAULO, 10).canGet(StatusCondition.PARALYSIS)).isFalse();
        assertThat(new Monster(Catalog.GROOT, 10).canGet(StatusCondition.SLEEP)).isFalse();
        assertThat(new Monster(Catalog.GROOT, 10).canGet(StatusCondition.BURN)).isTrue();
        assertThat(new Monster(Catalog.GROOT, 10).canGet(StatusCondition.NONE)).isFalse();
    }

    @Test
    void faintedMonsterGetsNoStatus() {
        Monster m = new Monster(Catalog.COISO, 10);
        m.takeDamage(999);
        assertThat(m.canGet(StatusCondition.BURN)).isFalse();
    }

    @Test
    void sleepCountsDownTurns() {
        Monster m = new Monster(Catalog.COISO, 10);
        assertThatThrownBy(() -> m.inflict(StatusCondition.SLEEP, 4)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> m.inflict(StatusCondition.SLEEP, 0)).isInstanceOf(IllegalArgumentException.class);
        m.inflict(StatusCondition.SLEEP, 2);
        m.sleepTick();
        m.sleepTick();
        assertThat(m.sleepTurns()).isZero();
        assertThatThrownBy(m::sleepTick).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void stagesAreClampedAndScaleStats() {
        Monster m = new Monster(Catalog.COISO, 20);
        int def = m.defense();
        assertThat(m.changeStage(Stat.DEF, 2)).isEqualTo(2);
        assertThat(m.effectiveDefense()).isEqualTo(def * 2);
        assertThat(m.changeStage(Stat.DEF, 5)).isEqualTo(4);
        assertThat(m.stage(Stat.DEF)).isEqualTo(6);
        assertThat(m.changeStage(Stat.DEF, 1)).isZero();
        assertThat(m.effectiveDefense()).isEqualTo(def * 4);

        assertThat(m.changeStage(Stat.SPD, -9)).isEqualTo(-6);
        assertThat(m.effectiveSpeed()).isEqualTo(Math.max(1, m.speed() / 4));
        assertThat(m.stages()).containsOnlyKeys(Stat.DEF, Stat.SPD);

        m.resetStages();
        assertThat(m.stages()).isEmpty();
        assertThat(m.effectiveDefense()).isEqualTo(def);
    }

    @Test
    void burnHalvesAttackAndParalysisHalvesSpeed() {
        Monster burned = new Monster(Catalog.COISO, 20);
        burned.inflict(StatusCondition.BURN, 0);
        assertThat(burned.effectiveAttack()).isEqualTo(burned.attack() / 2);
        assertThat(burned.effectiveSpeed()).isEqualTo(burned.speed());

        Monster paralyzed = new Monster(Catalog.LUCIFER, 20);
        paralyzed.inflict(StatusCondition.PARALYSIS, 0);
        assertThat(paralyzed.effectiveSpeed()).isEqualTo(paralyzed.speed() / 2);
        assertThat(paralyzed.effectiveAttack()).isEqualTo(paralyzed.attack());
    }

    @Test
    void clearBattleStateRemovesStatusAndStages() {
        Monster m = new Monster(Catalog.LINDOYA, 10);
        m.inflict(StatusCondition.SLEEP, 3);
        m.changeStage(Stat.ATK, 1);
        m.clearBattleState();
        assertThat(m.status()).isEqualTo(StatusCondition.NONE);
        assertThat(m.sleepTurns()).isZero();
        assertThat(m.stages()).isEmpty();
    }

    @Test
    void restoreBattleStateValidatesInput() {
        Monster m = new Monster(Catalog.LINDOYA, 10);
        m.restoreBattleState(StatusCondition.SLEEP, 2, Map.of(Stat.ATK, -1, Stat.DEF, 0));
        assertThat(m.status()).isEqualTo(StatusCondition.SLEEP);
        assertThat(m.sleepTurns()).isEqualTo(2);
        assertThat(m.stages()).containsOnly(Map.entry(Stat.ATK, -1));

        assertThatThrownBy(() -> m.restoreBattleState(StatusCondition.BURN, 2, Map.of())).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> m.restoreBattleState(null, 0, Map.of())).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> m.restoreBattleState(StatusCondition.SLEEP, 4, Map.of())).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> m.restoreBattleState(StatusCondition.NONE, 0, Map.of(Stat.SPD, 7)))
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
