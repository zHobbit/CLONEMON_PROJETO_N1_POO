package br.clonemon.domain;

/** Atributos que golpes podem subir ou baixar durante a batalha, em estagios de -6 a +6. */
public enum Stat {
    ATK("O ataque"), DEF("A defesa"), SPD("A velocidade");

    public static final int MAX_STAGE = 6;

    private final String label;

    Stat(String label) { this.label = label; }

    /** Nome com artigo, para as mensagens da batalha ("O ataque de Coiso subiu!"). */
    public String label() { return label; }

    /** Multiplicador do estagio, como nos jogos da Nintendo: +1 = 1,5x, +2 = 2x ... -1 = 0,67x, -2 = 0,5x. */
    public static double multiplier(int stage) {
        if (Math.abs(stage) > MAX_STAGE) throw new IllegalArgumentException("Stage out of range: " + stage);
        return stage >= 0 ? (2.0 + stage) / 2.0 : 2.0 / (2.0 - stage);
    }
}
