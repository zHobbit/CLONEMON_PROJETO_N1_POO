package br.clonemon.domain;

/**
 * Efeito secundario de um golpe, sorteado com {@code chance}% quando ele acerta.
 * Status e LOWER valem para o alvo; RAISE vale para quem usou o golpe.
 */
public record MoveEffect(Kind kind, int chance, Stat stat, int stages) {

    public enum Kind { NONE, BURN, FREEZE, PARALYSIS, SLEEP, RAISE, LOWER }

    public static final MoveEffect NONE = new MoveEffect(Kind.NONE, 0, null, 0);

    public MoveEffect {
        if (kind == null) throw new IllegalArgumentException("Effect kind required");
        boolean changesStat = kind == Kind.RAISE || kind == Kind.LOWER;
        boolean valid = kind == Kind.NONE
                ? chance == 0 && stat == null && stages == 0
                : chance >= 1 && chance <= 100
                  && (changesStat ? stat != null && stages >= 1 && stages <= Stat.MAX_STAGE : stat == null && stages == 0);
        if (!valid) throw new IllegalArgumentException("Invalid effect: " + kind + " " + chance + "% " + stat + " " + stages);
    }

    public static MoveEffect inflict(StatusCondition status, int chance) {
        if (status == StatusCondition.NONE) return NONE;
        return new MoveEffect(Kind.valueOf(status.name()), chance, null, 0);
    }

    public static MoveEffect raise(Stat stat, int stages) {
        return new MoveEffect(Kind.RAISE, 100, stat, stages);
    }

    public static MoveEffect lower(Stat stat, int stages, int chance) {
        return new MoveEffect(Kind.LOWER, chance, stat, stages);
    }

    /** Status aplicado no alvo, ou NONE se o efeito nao for de status. */
    public StatusCondition status() {
        return switch (kind) {
            case BURN -> StatusCondition.BURN;
            case FREEZE -> StatusCondition.FREEZE;
            case PARALYSIS -> StatusCondition.PARALYSIS;
            case SLEEP -> StatusCondition.SLEEP;
            case NONE, RAISE, LOWER -> StatusCondition.NONE;
        };
    }
}
