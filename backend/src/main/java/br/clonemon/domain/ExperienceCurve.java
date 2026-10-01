package br.clonemon.domain;

public final class ExperienceCurve {
    public static final int MAX_LEVEL = 50;

    private ExperienceCurve() {}

    /** XP total necessario para atingir o nivel (curva cubica). */
    public static int xpForLevel(int level) {
        return level <= 1 ? 0 : level * level * level;
    }

    public static int levelFor(int totalXp) {
        int level = 1;
        while (level < MAX_LEVEL && totalXp >= xpForLevel(level + 1)) level++;
        return level;
    }

    public static int xpReward(int defeatedLevel) {
        return defeatedLevel * 20;
    }
}
