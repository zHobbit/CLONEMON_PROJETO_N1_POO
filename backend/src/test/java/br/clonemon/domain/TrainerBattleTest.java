package br.clonemon.domain;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.random.RandomGenerator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Batalha contra treinador do mapa: sem fuga, time com varios monstros, cada troca anunciada pelo nome. */
class TrainerBattleTest {

    private static final RandomGenerator ALWAYS_HIT_NO_CRIT = new RandomGenerator() {
        @Override public long nextLong() { return 50; }
        @Override public int nextInt(int bound) { return Math.min(50, bound - 1); }
    };
    private final DamageCalculator calc = new DamageCalculator(ALWAYS_HIT_NO_CRIT);

    private Battle againstZeca(Monster hero) {
        return new Battle(List.of(hero), Catalog.ZECA.freshTeam(), Catalog.ZECA.name(), calc, AiStrategy.greedy());
    }

    @Test
    void cannotRunFromTrainer() {
        Battle b = againstZeca(new Monster(Catalog.LINDOYA, 10));

        assertThatThrownBy(() -> b.submit(new Battle.Run()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Nao da para fugir de batalha contra treinador");
        assertThat(b.status()).isEqualTo(Battle.Status.AWAITING_ACTION);
        assertThat(b.log()).isEmpty();
    }

    @Test
    void trainerSendsEachMonsterByNameUntilTeamIsDown() {
        Monster hero = new Monster(Catalog.LINDOYA, 50);
        Battle b = againstZeca(hero);
        assertThat(b.enemyActiveIndex()).isZero();

        List<Battle.Event> first = b.submit(new Battle.UseMove(1));

        assertThat(first).filteredOn(e -> e.effect() == Battle.Effect.ENEMY_SWITCH)
                .extracting(Battle.Event::text).containsExactly("ZECA enviou Pinguim!");
        assertThat(b.enemyActiveIndex()).isEqualTo(1);
        assertThat(b.enemyMonster().species()).isEqualTo(Catalog.PINGUIM);
        assertThat(b.status()).isEqualTo(Battle.Status.AWAITING_ACTION);

        b.submit(new Battle.UseMove(1));
        b.submit(new Battle.UseMove(1));

        assertThat(b.status()).isEqualTo(Battle.Status.PLAYER_WON);
        assertThat(b.log()).contains("ZECA enviou Lucifer!", "Voce venceu!").doesNotContain("Oponente enviou Pinguim!");
        assertThat(b.log()).filteredOn(t -> t.startsWith("Lindoya ganhou")).hasSize(3);
    }

    @Test
    void restoreKeepsTheOpponentOnlyWhenGiven() {
        Battle.State state = againstZeca(new Monster(Catalog.LINDOYA, 10)).state();

        Battle trainer = Battle.restore(state, "ZECA", calc, AiStrategy.greedy());
        assertThat(trainer.isAgainstTrainer()).isTrue();
        assertThat(trainer.opponentName()).isEqualTo("ZECA");
        assertThatThrownBy(() -> trainer.submit(new Battle.Run())).isInstanceOf(IllegalArgumentException.class);

        Battle wild = Battle.restore(state, calc, AiStrategy.greedy());
        assertThat(wild.isAgainstTrainer()).isFalse();
        wild.submit(new Battle.Run());
        assertThat(wild.status()).isEqualTo(Battle.Status.FLED);
    }

    @Test
    void wildBattleHasNoOpponentName() {
        Battle b = new Battle(List.of(new Monster(Catalog.GROOT, 5)), List.of(new Monster(Catalog.COISO, 5)), calc, AiStrategy.greedy());
        assertThat(b.opponentName()).isNull();
        assertThat(b.isAgainstTrainer()).isFalse();
    }

    @Test
    void npcTeamIsFreshOnEveryChallenge() {
        List<Monster> team = Catalog.ZECA.freshTeam();
        team.getFirst().takeDamage(5);

        List<Monster> again = Catalog.ZECA.freshTeam();
        assertThat(again).extracting(Monster::species).containsExactly(Catalog.PAO_DE_ACUCAR, Catalog.PINGUIM, Catalog.LUCIFER);
        assertThat(again).extracting(Monster::level).containsExactly(8, 9, 10);
        assertThat(again).allMatch(m -> m.currentHp() == m.maxHp());
    }

    @Test
    void npcNeedsATeam() {
        assertThatThrownBy(() -> new NpcTrainer("x", "X", List.of())).isInstanceOf(IllegalArgumentException.class);
    }
}
