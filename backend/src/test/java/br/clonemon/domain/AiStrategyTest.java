package br.clonemon.domain;

import org.junit.jupiter.api.Test;

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
        Monster self = new Monster(Catalog.LUCIFER, 10);
        for (int i = 0; i < 10; i++) self.use(1);
        assertThat(AiStrategy.greedy().chooseMove(self, new Monster(Catalog.OLAF, 10))).isZero();
    }

    @Test
    void randomOnlyPicksUsableMoves() {
        Monster self = new Monster(Catalog.GROOT, 10);
        for (int i = 0; i < 25; i++) self.use(0);
        AiStrategy ai = AiStrategy.random(RandomGenerator.of("L64X128MixRandom"));
        for (int i = 0; i < 20; i++) assertThat(ai.chooseMove(self, self)).isEqualTo(1);
    }
}
