package br.clonemon.domain;

import java.util.random.RandomGenerator;

/** Dano no estilo da primeira geracao. E tambem o dado da batalha: todo sorteio passa pelo gerador injetado. */
public class DamageCalculator {
    public static final double STAB = 1.5;
    public static final double CRIT = 1.5;
    public static final int CRIT_CHANCE_PERCENT = 6;

    public record Result(int damage, boolean hit, boolean critical, double effectiveness) {}

    private final RandomGenerator rng;

    public DamageCalculator(RandomGenerator rng) { this.rng = rng; }

    public Result calculate(Monster attacker, Monster defender, Move move) {
        double eff = move.element().effectivenessAgainst(defender.species().element());
        if (rng.nextInt(100) >= move.accuracy()) return new Result(0, false, false, eff);
        // Golpe de status: so a precisao importa.
        if (!move.isDamaging()) return new Result(0, true, false, Element.NEUTRAL);
        boolean crit = rng.nextInt(100) < CRIT_CHANCE_PERCENT;
        double base = ((2.0 * attacker.level() / 5 + 2) * move.power() * attacker.effectiveAttack() / defender.effectiveDefense()) / 50 + 2;
        double mod = eff
                * (move.element() == attacker.species().element() ? STAB : 1.0)
                * (crit ? CRIT : 1.0);
        int dmg = Math.max(1, (int) (base * mod));
        return new Result(dmg, true, crit, eff);
    }

    /** Verdadeiro com {@code percent}% de chance; 100% nao gasta sorteio. */
    public boolean chance(int percent) {
        return percent >= 100 || (percent > 0 && rng.nextInt(100) < percent);
    }

    /** Inteiro sorteado entre {@code min} e {@code max}, inclusive. */
    public int between(int min, int max) {
        return min + rng.nextInt(max - min + 1);
    }
}
