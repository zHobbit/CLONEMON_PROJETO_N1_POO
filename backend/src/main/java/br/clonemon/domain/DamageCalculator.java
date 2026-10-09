package br.clonemon.domain;

import java.util.random.RandomGenerator;

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
        boolean crit = rng.nextInt(100) < CRIT_CHANCE_PERCENT;
        double base = ((2.0 * attacker.level() / 5 + 2) * move.power() * attacker.attack() / defender.defense()) / 50 + 2;
        double mod = eff
                * (move.element() == attacker.species().element() ? STAB : 1.0)
                * (crit ? CRIT : 1.0);
        int dmg = Math.max(1, (int) (base * mod));
        return new Result(dmg, true, crit, eff);
    }
}
