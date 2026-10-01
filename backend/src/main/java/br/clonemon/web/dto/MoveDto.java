package br.clonemon.web.dto;

import br.clonemon.domain.Element;
import br.clonemon.domain.Monster;
import br.clonemon.domain.Move;

import java.util.List;
import java.util.stream.IntStream;

/** {@code ppLeft} e nulo quando o golpe nao pertence a um monstro (ex.: catalogo de especies). */
public record MoveDto(String name, Element element, int power, int accuracy, int maxPp, Integer ppLeft) {

    public static MoveDto of(Move m, Integer ppLeft) {
        return new MoveDto(m.name(), m.element(), m.power(), m.accuracy(), m.maxPp(), ppLeft);
    }

    public static List<MoveDto> of(Monster m) {
        return IntStream.range(0, m.moves().size()).mapToObj(i -> of(m.moves().get(i), m.ppLeft(i))).toList();
    }
}
