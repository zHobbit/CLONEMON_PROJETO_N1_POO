package br.clonemon.domain;

/** Ciclo: AGUA -> ROCHA -> FOGO -> GELO -> GRAMA -> RAIO -> AGUA (cada um vence o seguinte). */
public enum Element {
    AGUA, ROCHA, FOGO, GELO, GRAMA, RAIO;

    public static final double STRONG = 2.0;
    public static final double WEAK = 0.5;
    public static final double NEUTRAL = 1.0;

    public Element beats() {
        Element[] all = values();
        return all[(ordinal() + 1) % all.length];
    }

    public double effectivenessAgainst(Element defender) {
        if (beats() == defender) return STRONG;
        if (defender.beats() == this) return WEAK;
        return NEUTRAL;
    }
}
