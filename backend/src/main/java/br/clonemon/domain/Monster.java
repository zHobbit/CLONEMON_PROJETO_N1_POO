package br.clonemon.domain;

import java.util.ArrayList;
import java.util.List;

public class Monster {
    private final Species species;
    private int xp;
    private int currentHp;
    private final int[] pp;

    public Monster(Species species, int level) {
        this.species = species;
        this.xp = ExperienceCurve.xpForLevel(level);
        this.currentHp = maxHp();
        this.pp = species.moves().stream().mapToInt(Move::maxPp).toArray();
    }

    private Monster(Species species, int xp, int currentHp, int[] pp) {
        this.species = species;
        this.xp = xp;
        this.currentHp = currentHp;
        this.pp = pp;
    }

    /** Reconstroi um monstro a partir de estado salvo. */
    public static Monster restore(Species species, int xp, int currentHp, int[] pp) {
        if (xp < 0) throw new IllegalArgumentException("Negative xp");
        if (pp.length != species.moves().size()) throw new IllegalArgumentException("PP count does not match moves");
        for (int i = 0; i < pp.length; i++)
            if (pp[i] < 0 || pp[i] > species.moves().get(i).maxPp()) throw new IllegalArgumentException("Invalid PP at " + i);
        Monster m = new Monster(species, xp, currentHp, pp.clone());
        if (currentHp < 0 || currentHp > m.maxHp()) throw new IllegalArgumentException("Invalid HP: " + currentHp);
        return m;
    }

    public int[] ppSnapshot() { return pp.clone(); }

    public Species species() { return species; }
    public int level() { return ExperienceCurve.levelFor(xp); }
    public int xp() { return xp; }
    public int currentHp() { return currentHp; }
    public boolean isFainted() { return currentHp == 0; }
    public List<Move> moves() { return species.moves(); }
    public int ppLeft(int moveIndex) { return pp[moveIndex]; }

    public int maxHp() { return stat(species.baseHp()) + level() + 5; }
    public int attack() { return stat(species.baseAtk()); }
    public int defense() { return stat(species.baseDef()); }
    public int speed() { return stat(species.baseSpd()); }

    private int stat(int base) { return (2 * base * level()) / 100 + 5; }

    public void takeDamage(int amount) {
        currentHp = Math.max(0, currentHp - Math.max(0, amount));
    }

    public void heal(int amount) {
        currentHp = Math.min(maxHp(), currentHp + Math.max(0, amount));
    }

    /** Centro Clonemon: HP e PP cheios. */
    public void fullRestore() {
        currentHp = maxHp();
        for (int i = 0; i < pp.length; i++) pp[i] = moves().get(i).maxPp();
    }

    public boolean canUse(int moveIndex) {
        return moveIndex >= 0 && moveIndex < pp.length && pp[moveIndex] > 0;
    }

    public Move use(int moveIndex) {
        if (!canUse(moveIndex)) throw new IllegalStateException("Move unavailable: " + moveIndex);
        pp[moveIndex]--;
        return moves().get(moveIndex);
    }

    public List<Integer> usableMoves() {
        List<Integer> out = new ArrayList<>();
        for (int i = 0; i < pp.length; i++) if (pp[i] > 0) out.add(i);
        return out;
    }

    /** @return niveis ganhos */
    public int gainXp(int amount) {
        int before = level();
        int hpMissing = maxHp() - currentHp;
        xp = Math.min(ExperienceCurve.xpForLevel(ExperienceCurve.MAX_LEVEL), xp + amount);
        currentHp = maxHp() - hpMissing;
        return level() - before;
    }
}
