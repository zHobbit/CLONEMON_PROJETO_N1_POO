package br.clonemon.domain;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

public class Monster {
    private final Species species;
    private int xp;
    private int currentHp;
    /** PP de cada golpe conhecido, na ordem da especie; cresce quando o monstro aprende um golpe. */
    private int[] pp;

    // Estado que so existe durante a batalha (nao e salvo no monstro).
    private StatusCondition status = StatusCondition.NONE;
    private int sleepTurns;
    private final EnumMap<Stat, Integer> stages = new EnumMap<>(Stat.class);

    public Monster(Species species, int level) {
        this.species = species;
        this.xp = ExperienceCurve.xpForLevel(level);
        this.currentHp = maxHp();
        this.pp = species.moves().stream().limit(species.knownMoveCount(level())).mapToInt(Move::maxPp).toArray();
    }

    private Monster(Species species, int xp, int currentHp, int[] pp) {
        this.species = species;
        this.xp = xp;
        this.currentHp = currentHp;
        this.pp = pp;
    }

    /**
     * Reconstroi um monstro a partir de estado salvo. Saves antigos podem ter menos PP que golpes conhecidos
     * no nivel atual (o monstro subiu de nivel antes de a especie ganhar golpes novos): esses golpes vem com PP cheio.
     */
    public static Monster restore(Species species, int xp, int currentHp, int[] pp) {
        if (xp < 0) throw new IllegalArgumentException("Negative xp");
        int known = species.knownMoveCount(ExperienceCurve.levelFor(xp));
        if (pp.length > known) throw new IllegalArgumentException("More PP entries than known moves");
        for (int i = 0; i < pp.length; i++)
            if (pp[i] < 0 || pp[i] > species.moves().get(i).maxPp()) throw new IllegalArgumentException("Invalid PP at " + i);
        Monster m = new Monster(species, xp, currentHp, pp.clone());
        m.learnMoves();
        if (currentHp < 0 || currentHp > m.maxHp()) throw new IllegalArgumentException("Invalid HP: " + currentHp);
        return m;
    }

    public int[] ppSnapshot() { return pp.clone(); }

    public Species species() { return species; }
    public int level() { return ExperienceCurve.levelFor(xp); }
    public int xp() { return xp; }
    public int currentHp() { return currentHp; }
    public boolean isFainted() { return currentHp == 0; }
    /** Golpes conhecidos no nivel atual, na ordem em que foram aprendidos. */
    public List<Move> moves() { return species.moves().subList(0, pp.length); }
    public int ppLeft(int moveIndex) { return pp[moveIndex]; }

    public int maxHp() { return stat(species.baseHp()) + level() + 5; }
    public int attack() { return stat(species.baseAtk()); }
    public int defense() { return stat(species.baseDef()); }
    public int speed() { return stat(species.baseSpd()); }

    private int stat(int base) { return (2 * base * level()) / 100 + 5; }

    // --- Atributos em batalha: estagios e status ---

    /** Ataque com estagios; a queimadura corta pela metade. */
    public int effectiveAttack() {
        return boosted(attack(), Stat.ATK, status == StatusCondition.BURN ? 0.5 : 1.0);
    }

    public int effectiveDefense() {
        return boosted(defense(), Stat.DEF, 1.0);
    }

    /** Velocidade com estagios; a paralisia corta pela metade. */
    public int effectiveSpeed() {
        return boosted(speed(), Stat.SPD, status == StatusCondition.PARALYSIS ? 0.5 : 1.0);
    }

    private int boosted(int value, Stat stat, double factor) {
        return Math.max(1, (int) (value * Stat.multiplier(stage(stat)) * factor));
    }

    public StatusCondition status() { return status; }
    public int sleepTurns() { return sleepTurns; }
    public int stage(Stat stat) { return stages.getOrDefault(stat, 0); }

    /** Estagios diferentes de zero. */
    public Map<Stat, Integer> stages() { return Map.copyOf(stages); }

    /** Pode receber o status agora: esta de pe, sem outro status e nao e imune pelo elemento. */
    public boolean canGet(StatusCondition s) {
        return !isFainted() && status == StatusCondition.NONE && s.affects(species.element());
    }

    /** @param sleepTurns turnos dormindo (1 a 3), so para SLEEP */
    public void inflict(StatusCondition s, int sleepTurns) {
        if (!canGet(s)) throw new IllegalStateException("Cannot inflict " + s);
        if (s == StatusCondition.SLEEP
                && (sleepTurns < StatusCondition.MIN_SLEEP_TURNS || sleepTurns > StatusCondition.MAX_SLEEP_TURNS))
            throw new IllegalArgumentException("Invalid sleep turns: " + sleepTurns);
        status = s;
        this.sleepTurns = s == StatusCondition.SLEEP ? sleepTurns : 0;
    }

    /** Gasta um turno de sono. */
    public void sleepTick() {
        if (status != StatusCondition.SLEEP || sleepTurns == 0) throw new IllegalStateException("Not sleeping");
        sleepTurns--;
    }

    public void cure() {
        status = StatusCondition.NONE;
        sleepTurns = 0;
    }

    /** Soma {@code delta} ao estagio, limitado a -6..+6. @return quanto o estagio realmente mudou */
    public int changeStage(Stat stat, int delta) {
        int before = stage(stat);
        int after = Math.clamp(before + (long) delta, -Stat.MAX_STAGE, Stat.MAX_STAGE);
        if (after == 0) stages.remove(stat);
        else stages.put(stat, after);
        return after - before;
    }

    /** Estagios voltam a zero quando o monstro sai de campo. */
    public void resetStages() { stages.clear(); }

    /** Fim da batalha: status e estagios somem. */
    public void clearBattleState() {
        cure();
        resetStages();
    }

    /** Restaura o estado de batalha salvo junto com a batalha. */
    public void restoreBattleState(StatusCondition status, int sleepTurns, Map<Stat, Integer> stages) {
        if (status == null || sleepTurns < 0 || sleepTurns > StatusCondition.MAX_SLEEP_TURNS
                || (sleepTurns > 0 && status != StatusCondition.SLEEP))
            throw new IllegalArgumentException("Invalid status: " + status + " " + sleepTurns);
        stages.values().forEach(Stat::multiplier); // valida o intervalo
        this.status = status;
        this.sleepTurns = sleepTurns;
        this.stages.clear();
        stages.forEach((stat, stage) -> { if (stage != 0) this.stages.put(stat, stage); });
    }

    // --- HP, PP e XP ---

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

    /** Ganha XP e aprende os golpes dos niveis alcancados (com PP cheio). @return niveis ganhos */
    public int gainXp(int amount) {
        int before = level();
        int hpMissing = maxHp() - currentHp;
        xp = Math.min(ExperienceCurve.xpForLevel(ExperienceCurve.MAX_LEVEL), xp + amount);
        currentHp = maxHp() - hpMissing;
        learnMoves();
        return level() - before;
    }

    private void learnMoves() {
        int known = species.knownMoveCount(level());
        if (known <= pp.length) return;
        int before = pp.length;
        pp = Arrays.copyOf(pp, known);
        for (int i = before; i < known; i++) pp[i] = species.moves().get(i).maxPp();
    }
}
