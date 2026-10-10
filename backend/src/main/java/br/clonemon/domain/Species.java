package br.clonemon.domain;

import java.util.Collections;
import java.util.List;

/**
 * Especie. {@code learnLevels[i]} e o nivel em que o golpe {@code moves[i]} e aprendido; os golpes ficam
 * na ordem em que sao aprendidos, entao os golpes conhecidos num nivel sao sempre um prefixo da lista.
 */
public record Species(long id, String name, Element element, int baseHp, int baseAtk, int baseDef, int baseSpd,
                      List<Move> moves, List<Integer> learnLevels) {

    /** O menu de golpes da batalha mostra no maximo 4. */
    public static final int MAX_MOVES = 4;

    public Species {
        moves = List.copyOf(moves);
        learnLevels = List.copyOf(learnLevels);
        if (moves.isEmpty()) throw new IllegalArgumentException("Species needs at least one move: " + name);
        if (moves.size() > MAX_MOVES) throw new IllegalArgumentException("Species has more than " + MAX_MOVES + " moves: " + name);
        if (learnLevels.size() != moves.size()) throw new IllegalArgumentException("One learn level per move: " + name);
        if (learnLevels.getFirst() != 1) throw new IllegalArgumentException("First move must be learned at level 1: " + name);
        for (int i = 1; i < learnLevels.size(); i++)
            if (learnLevels.get(i) < learnLevels.get(i - 1) || learnLevels.get(i) > ExperienceCurve.MAX_LEVEL)
                throw new IllegalArgumentException("Moves must be listed in learn order: " + name);
    }

    /** Todos os golpes aprendidos no nivel 1. */
    public Species(long id, String name, Element element, int baseHp, int baseAtk, int baseDef, int baseSpd, List<Move> moves) {
        this(id, name, element, baseHp, baseAtk, baseDef, baseSpd, moves, Collections.nCopies(moves.size(), 1));
    }

    /** Quantos golpes um monstro desta especie conhece no nivel dado. */
    public int knownMoveCount(int level) {
        int n = 0;
        while (n < learnLevels.size() && learnLevels.get(n) <= level) n++;
        return n;
    }
}
