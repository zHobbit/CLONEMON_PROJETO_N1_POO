package br.clonemon.domain;

import java.util.List;

public record Species(long id, String name, Element element, int baseHp, int baseAtk, int baseDef, int baseSpd, List<Move> moves) {
    public Species {
        moves = List.copyOf(moves);
        if (moves.isEmpty()) throw new IllegalArgumentException("Species needs at least one move: " + name);
    }
}
