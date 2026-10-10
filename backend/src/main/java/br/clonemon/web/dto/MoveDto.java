package br.clonemon.web.dto;

import br.clonemon.domain.Element;
import br.clonemon.domain.Monster;
import br.clonemon.domain.Move;
import br.clonemon.domain.MoveEffect;
import br.clonemon.domain.Species;
import br.clonemon.domain.Stat;

import java.util.List;
import java.util.stream.IntStream;

/**
 * {@code ppLeft} e nulo quando o golpe nao pertence a um monstro (ex.: catalogo de especies).
 * O efeito vale para o alvo, exceto RAISE, que sobe um atributo de quem usa o golpe.
 */
public record MoveDto(String name, Element element, int power, int accuracy, int maxPp, Integer ppLeft, int learnLevel,
                      MoveEffect.Kind effect, int effectChance, Stat effectStat, int effectStages) {

    public static MoveDto of(Move m, int learnLevel, Integer ppLeft) {
        MoveEffect fx = m.effect();
        return new MoveDto(m.name(), m.element(), m.power(), m.accuracy(), m.maxPp(), ppLeft, learnLevel,
                fx.kind(), fx.chance(), fx.stat(), fx.stages());
    }

    /** Golpes conhecidos pelo monstro, com o PP restante. */
    public static List<MoveDto> of(Monster m) {
        return IntStream.range(0, m.moves().size())
                .mapToObj(i -> of(m.moves().get(i), m.species().learnLevels().get(i), m.ppLeft(i))).toList();
    }

    /** Todos os golpes que a especie aprende, em ordem de nivel. */
    public static List<MoveDto> of(Species s) {
        return IntStream.range(0, s.moves().size())
                .mapToObj(i -> of(s.moves().get(i), s.learnLevels().get(i), null)).toList();
    }
}
