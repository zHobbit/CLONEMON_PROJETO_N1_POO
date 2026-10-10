package br.clonemon.domain;

import org.junit.jupiter.api.Test;

import java.util.random.RandomGenerator;

import static org.assertj.core.api.Assertions.assertThat;

class DamageCalculatorTest {

    /** Retorna sempre o mesmo valor: 99 => acerto em accuracy 100 e sem critico. */
    private static RandomGenerator fixed(int value) {
        return new RandomGenerator() {
            @Override public long nextLong() { return value; }
            @Override public int nextInt(int bound) { return value; }
        };
    }

    private final Monster lindoya = new Monster(Catalog.LINDOYA, 20);
    private final Monster coiso = new Monster(Catalog.COISO, 20);
    private final Monster olaf = new Monster(Catalog.OLAF, 20);

    @Test
    void superEffectiveDealsMoreThanNeutral() {
        DamageCalculator calc = new DamageCalculator(fixed(50));
        Move cuspe = Catalog.LINDOYA.moves().get(0);
        var vsRock = calc.calculate(lindoya, coiso, cuspe);
        var vsIce = calc.calculate(lindoya, olaf, cuspe);
        assertThat(vsRock.effectiveness()).isEqualTo(2.0);
        assertThat(vsRock.damage()).isGreaterThan(vsIce.damage());
    }

    @Test
    void stabIncreasesDamage() {
        DamageCalculator calc = new DamageCalculator(fixed(50));
        Move water = new Move("x", Element.AGUA, 40, 100, 1);
        Move ice = new Move("y", Element.GELO, 40, 100, 1);
        Monster target = new Monster(Catalog.LUCIFER, 20); // neutro contra AGUA? AGUA x FOGO neutro; GELO x FOGO fraco
        Monster neutralTarget = new Monster(Catalog.GROOT, 20); // AGUA x GRAMA neutro, GELO x GRAMA forte
        assertThat(calc.calculate(lindoya, target, water).damage()).isGreaterThan(0);
        int stab = calc.calculate(lindoya, olaf, water).damage();      // AGUA vs GELO neutro com STAB
        int noStab = calc.calculate(lindoya, olaf, new Move("z", Element.FOGO, 40, 100, 1)).damage(); // FOGO vs GELO forte, sem STAB
        assertThat(stab).isLessThan(noStab); // 1.5 < 2.0
        assertThat(calc.calculate(lindoya, neutralTarget, ice).effectiveness()).isEqualTo(2.0);
    }

    @Test
    void missWhenRollAboveAccuracy() {
        var r = new DamageCalculator(fixed(90)).calculate(lindoya, coiso, Catalog.LINDOYA.moves().get(1)); // acc 85
        assertThat(r.hit()).isFalse();
        assertThat(r.damage()).isZero();
    }

    @Test
    void criticalWhenRollLow() {
        var normal = new DamageCalculator(fixed(50)).calculate(lindoya, olaf, Catalog.LINDOYA.moves().get(0));
        var crit = new DamageCalculator(fixed(0)).calculate(lindoya, olaf, Catalog.LINDOYA.moves().get(0));
        assertThat(crit.critical()).isTrue();
        assertThat(crit.damage()).isGreaterThan(normal.damage());
    }

    @Test
    void statusMoveOnlyRollsAccuracy() {
        Move sleep = Catalog.GROOT.moves().get(3); // Cha de camomila: poder 0, precisao 75
        var hit = new DamageCalculator(fixed(0)).calculate(lindoya, coiso, sleep);
        assertThat(hit.hit()).isTrue();
        assertThat(hit.damage()).isZero();
        assertThat(hit.critical()).isFalse();
        assertThat(hit.effectiveness()).isEqualTo(Element.NEUTRAL);
        assertThat(new DamageCalculator(fixed(75)).calculate(lindoya, coiso, sleep).hit()).isFalse();
    }

    @Test
    void stagesAndBurnChangeDamage() {
        DamageCalculator calc = new DamageCalculator(fixed(50));
        Move cuspe = Catalog.LINDOYA.moves().get(0);
        int normal = calc.calculate(lindoya, olaf, cuspe).damage();

        lindoya.changeStage(Stat.ATK, 2);
        int boosted = calc.calculate(lindoya, olaf, cuspe).damage();
        olaf.changeStage(Stat.DEF, 2);
        int evened = calc.calculate(lindoya, olaf, cuspe).damage();
        lindoya.resetStages();
        lindoya.inflict(StatusCondition.BURN, 0);
        int burned = calc.calculate(lindoya, olaf, cuspe).damage();

        assertThat(boosted).isGreaterThan(normal);
        assertThat(evened).isEqualTo(normal);
        assertThat(burned).isLessThan(normal);
    }

    @Test
    void chanceUsesTheInjectedGenerator() {
        assertThat(new DamageCalculator(fixed(29)).chance(30)).isTrue();
        assertThat(new DamageCalculator(fixed(30)).chance(30)).isFalse();
        assertThat(new DamageCalculator(fixed(99)).chance(100)).isTrue();
        assertThat(new DamageCalculator(fixed(0)).chance(0)).isFalse();
        assertThat(new DamageCalculator(fixed(2)).between(1, 3)).isEqualTo(3);
        assertThat(new DamageCalculator(fixed(0)).between(1, 3)).isEqualTo(1);
    }

    @Test
    void minimumDamageIsOne() {
        Monster weak = new Monster(Catalog.ELETROPAULO, 1);
        Monster tank = new Monster(Catalog.COISO, 50);
        var r = new DamageCalculator(fixed(50)).calculate(weak, tank, new Move("t", Element.FOGO, 1, 100, 1));
        assertThat(r.damage()).isGreaterThanOrEqualTo(1);
    }
}
