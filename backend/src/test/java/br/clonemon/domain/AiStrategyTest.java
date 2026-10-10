package br.clonemon.domain;

import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;
import java.util.random.RandomGenerator;

import static org.assertj.core.api.Assertions.assertThat;

class AiStrategyTest {

    @Test
    void greedyPicksStrongestExpectedMove() {
        Monster self = new Monster(Catalog.LUCIFER, 10);
        assertThat(AiStrategy.greedy().chooseMove(self, new Monster(Catalog.OLAF, 10))).isEqualTo(1);
    }

    @Test
    void greedyFallsBackWhenBestHasNoPp() {
        Monster self = new Monster(Catalog.LUCIFER, 5);
        for (int i = 0; i < 10; i++) self.use(1);
        assertThat(AiStrategy.greedy().chooseMove(self, new Monster(Catalog.OLAF, 10))).isZero();
    }

    @Test
    void greedyConsidersMovesLearnedByLevel() {
        Monster self = new Monster(Catalog.LUCIFER, 10); // Churrasco grego (60) no nivel 7
        for (int i = 0; i < 10; i++) self.use(1);
        assertThat(AiStrategy.greedy().chooseMove(self, new Monster(Catalog.OLAF, 10))).isEqualTo(2);
    }

    @Test
    void greedyLeavesStatusMovesForLast() {
        Monster self = new Monster(Catalog.COISO, 12);
        int choice = AiStrategy.greedy().chooseMove(self, new Monster(Catalog.LUCIFER, 12));
        assertThat(self.moves().get(choice).isDamaging()).isTrue();
    }

    @Test
    void randomOnlyPicksUsableMoves() {
        Monster self = new Monster(Catalog.GROOT, 5);
        for (int i = 0; i < 25; i++) self.use(0);
        AiStrategy ai = AiStrategy.random(RandomGenerator.of("L64X128MixRandom"));
        for (int i = 0; i < 20; i++) assertThat(ai.chooseMove(self, self)).isEqualTo(1);
    }

    @Test
    void randomNeverPicksMovesNotLearnedYet() {
        AiStrategy ai = AiStrategy.random(RandomGenerator.of("L64X128MixRandom"));
        Monster young = new Monster(Catalog.GROOT, 6);
        Monster grown = new Monster(Catalog.GROOT, 12);
        Set<Integer> youngPicks = new HashSet<>();
        Set<Integer> grownPicks = new HashSet<>();
        for (int i = 0; i < 100; i++) {
            youngPicks.add(ai.chooseMove(young, grown));
            grownPicks.add(ai.chooseMove(grown, young));
        }
        assertThat(youngPicks).containsExactlyInAnyOrder(0, 1);
        assertThat(grownPicks).containsExactlyInAnyOrder(0, 1, 2, 3);
    }
}
