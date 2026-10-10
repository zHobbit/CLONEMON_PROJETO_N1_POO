package br.clonemon.domain;

/** Golpe. Poder 0 e golpe de status: nao causa dano, so testa a precisao e aplica o efeito. */
public record Move(String name, Element element, int power, int accuracy, int maxPp, MoveEffect effect) {
    public Move {
        if (power < 0 || accuracy < 1 || accuracy > 100 || maxPp < 1 || effect == null)
            throw new IllegalArgumentException("Invalid move: " + name);
    }

    /** Golpe sem efeito secundario. */
    public Move(String name, Element element, int power, int accuracy, int maxPp) {
        this(name, element, power, accuracy, maxPp, MoveEffect.NONE);
    }

    public boolean isDamaging() { return power > 0; }
}
