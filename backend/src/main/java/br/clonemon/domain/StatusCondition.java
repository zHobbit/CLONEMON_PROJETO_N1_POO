package br.clonemon.domain;

/**
 * Condicao de status de um monstro. Dura so enquanto a batalha acontece e um monstro tem no maximo uma.
 * Ninguem pega o status do proprio elemento: FOGO nao queima, GELO nao congela, RAIO nao paralisa, GRAMA nao dorme.
 */
public enum StatusCondition {
    NONE(null),
    /** Perde 1/16 do HP maximo no fim de cada turno e o ataque cai pela metade. */
    BURN(Element.FOGO),
    /** Nao age; a cada turno tem 20% de chance de descongelar. */
    FREEZE(Element.GELO),
    /** 25% de chance de perder a vez; velocidade pela metade. */
    PARALYSIS(Element.RAIO),
    /** Nao age por 1 a 3 turnos. */
    SLEEP(Element.GRAMA);

    public static final int THAW_CHANCE = 20;
    public static final int FULL_PARALYSIS_CHANCE = 25;
    public static final int BURN_DAMAGE_DIVISOR = 16;
    public static final int MIN_SLEEP_TURNS = 1;
    public static final int MAX_SLEEP_TURNS = 3;

    private final Element immune;

    StatusCondition(Element immune) { this.immune = immune; }

    /** Se um monstro deste elemento pode receber este status. */
    public boolean affects(Element element) {
        return this != NONE && element != immune;
    }
}
