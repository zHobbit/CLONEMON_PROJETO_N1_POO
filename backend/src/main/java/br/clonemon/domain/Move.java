package br.clonemon.domain;

public record Move(String name, Element element, int power, int accuracy, int maxPp) {
    public Move {
        if (power < 0 || accuracy < 1 || accuracy > 100 || maxPp < 1)
            throw new IllegalArgumentException("Invalid move: " + name);
    }
}
