package br.clonemon.domain;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.random.RandomGenerator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BattleTest {

    private static final RandomGenerator ALWAYS_HIT_NO_CRIT = new RandomGenerator() {
        @Override public long nextLong() { return 50; }
        @Override public int nextInt(int bound) { return Math.min(50, bound - 1); }
    };
    private final DamageCalculator calc = new DamageCalculator(ALWAYS_HIT_NO_CRIT);

    @Test
    void fasterMonsterAttacksFirst() {
        Battle b = new Battle(List.of(new Monster(Catalog.ELETROPAULO, 20)),
                List.of(new Monster(Catalog.COISO, 20)), calc, AiStrategy.greedy());
        List<Battle.Event> events = b.submit(new Battle.UseMove(0));
        assertThat(events.get(0).text()).startsWith("EletroPaulo usou");
    }

    @Test
    void strongPlayerWinsAndGainsXp() {
        Monster hero = new Monster(Catalog.LINDOYA, 50);
        int xpBefore = hero.xp();
        Battle b = new Battle(List.of(hero), List.of(new Monster(Catalog.COISO, 2)), calc, AiStrategy.greedy());
        b.submit(new Battle.UseMove(1));
        assertThat(b.status()).isEqualTo(Battle.Status.PLAYER_WON);
        assertThat(b.log()).contains("Voce venceu!", "E super efetivo!");
        assertThat(hero.xp()).isGreaterThanOrEqualTo(xpBefore);
    }

    @Test
    void forcedSwitchWhenActiveFaintsThenLoseWhenTeamWiped() {
        Monster a = new Monster(Catalog.COISO, 2);
        Monster c = new Monster(Catalog.COISO, 2);
        Battle b = new Battle(List.of(a, c), List.of(new Monster(Catalog.LINDOYA, 50)), calc, AiStrategy.greedy());
        b.submit(new Battle.UseMove(0));
        assertThat(a.isFainted()).isTrue();
        assertThat(b.playerMonster()).isSameAs(c);
        b.submit(new Battle.UseMove(0));
        assertThat(b.status()).isEqualTo(Battle.Status.PLAYER_LOST);
    }

    @Test
    void switchConsumesTurnAndEnemyAttacks() {
        Monster a = new Monster(Catalog.GROOT, 20);
        Monster c = new Monster(Catalog.COISO, 20);
        Monster enemy = new Monster(Catalog.LUCIFER, 20);
        Battle b = new Battle(List.of(a, c), List.of(enemy), calc, AiStrategy.greedy());
        List<Battle.Event> events = b.submit(new Battle.Switch(1));
        assertThat(events.get(0).text()).isEqualTo("Vai, Coiso!");
        assertThat(c.currentHp()).isLessThan(c.maxHp());
        assertThat(enemy.currentHp()).isEqualTo(enemy.maxHp());
    }

    @Test
    void invalidActionsRejected() {
        Battle b = new Battle(List.of(new Monster(Catalog.GROOT, 5)), List.of(new Monster(Catalog.OLAF, 5)), calc, AiStrategy.greedy());
        assertThatThrownBy(() -> b.submit(new Battle.Switch(0))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> b.submit(new Battle.UseMove(7))).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void cannotActAfterBattleFinished() {
        Battle b = new Battle(List.of(new Monster(Catalog.LINDOYA, 50)), List.of(new Monster(Catalog.COISO, 2)), calc, AiStrategy.greedy());
        b.submit(new Battle.UseMove(1));
        assertThatThrownBy(() -> b.submit(new Battle.UseMove(0))).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void eventsCarryVisibleStateAfterEachStep() {
        Monster hero = new Monster(Catalog.ELETROPAULO, 20);
        Monster enemy = new Monster(Catalog.LINDOYA, 20);
        int enemyHpBefore = enemy.currentHp();
        Battle b = new Battle(List.of(hero), List.of(enemy), calc, AiStrategy.greedy());

        List<Battle.Event> events = b.submit(new Battle.UseMove(0));

        Battle.Event playerAttack = events.get(0);
        assertThat(playerAttack.effect()).isEqualTo(Battle.Effect.ENEMY_HIT);
        assertThat(playerAttack.enemyHp()).isLessThan(enemyHpBefore);
        assertThat(playerAttack.playerHp()).isEqualTo(hero.maxHp());
        assertThat(events.get(1).text()).isEqualTo("E super efetivo!");
        Battle.Event enemyAttack = events.stream().filter(e -> e.text().startsWith("Lindoya usou")).findFirst().orElseThrow();
        assertThat(enemyAttack.effect()).isEqualTo(Battle.Effect.PLAYER_HIT);
        assertThat(enemyAttack.playerHp()).isEqualTo(hero.currentHp());
        assertThat(events.getLast().enemyHp()).isEqualTo(enemy.currentHp());
    }

    @Test
    void faintAndVictoryHaveEffects() {
        Battle b = new Battle(List.of(new Monster(Catalog.LINDOYA, 50)), List.of(new Monster(Catalog.COISO, 2)), calc, AiStrategy.greedy());
        List<Battle.Event> events = b.submit(new Battle.UseMove(1));
        assertThat(events).extracting(Battle.Event::effect)
                .containsSubsequence(Battle.Effect.ENEMY_HIT, Battle.Effect.ENEMY_FAINT, Battle.Effect.WON);
        assertThat(events.getLast().enemyHp()).isZero();
    }

    @Test
    void runEndsBattleWithoutEnemyAttack() {
        Monster hero = new Monster(Catalog.GROOT, 5);
        Battle b = new Battle(List.of(hero), List.of(new Monster(Catalog.LUCIFER, 30)), calc, AiStrategy.greedy());
        assertThat(b.submit(new Battle.Run())).extracting(Battle.Event::text).containsExactly("Voce fugiu!");
        assertThat(b.status()).isEqualTo(Battle.Status.FLED);
        assertThat(hero.currentHp()).isEqualTo(hero.maxHp());
    }

    @Test
    void stateRoundTripContinuesBattle() {
        Monster a = new Monster(Catalog.GROOT, 20);
        Monster c = new Monster(Catalog.COISO, 20);
        Battle b = new Battle(List.of(a, c), List.of(new Monster(Catalog.LUCIFER, 20)), calc, AiStrategy.greedy());
        b.submit(new Battle.Switch(1));

        Battle restored = Battle.restore(b.state(), calc, AiStrategy.greedy());
        assertThat(restored.playerMonster()).isSameAs(c);
        assertThat(restored.log()).isEqualTo(b.log());
        restored.submit(new Battle.UseMove(0));
        assertThat(restored.log()).hasSizeGreaterThan(b.log().size());
    }

    @Test
    void cannotStartWithFaintedTeam() {
        Monster m = new Monster(Catalog.GROOT, 5);
        m.takeDamage(999);
        assertThatThrownBy(() -> new Battle(List.of(m), List.of(new Monster(Catalog.OLAF, 5)), calc, AiStrategy.greedy()))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
