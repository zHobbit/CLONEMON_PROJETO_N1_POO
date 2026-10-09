package br.clonemon.domain;

import java.util.List;
import java.util.random.RandomGenerator;

public interface AiStrategy {
    int chooseMove(Monster self, Monster target);

    static AiStrategy random(RandomGenerator rng) {
        return (self, target) -> {
            List<Integer> usable = self.usableMoves();
            if (usable.isEmpty()) throw new IllegalStateException("No PP left");
            return usable.get(rng.nextInt(usable.size()));
        };
    }

    /** Escolhe o golpe com maior poder esperado (poder * precisao * efetividade * STAB). */
    static AiStrategy greedy() {
        return (self, target) -> self.usableMoves().stream()
                .max((a, b) -> Double.compare(score(self, target, a), score(self, target, b)))
                .orElseThrow(() -> new IllegalStateException("No PP left"));
    }

    private static double score(Monster self, Monster target, int idx) {
        Move m = self.moves().get(idx);
        return m.power() * (m.accuracy() / 100.0)
                * m.element().effectivenessAgainst(target.species().element())
                * (m.element() == self.species().element() ? DamageCalculator.STAB : 1.0);
    }
}
