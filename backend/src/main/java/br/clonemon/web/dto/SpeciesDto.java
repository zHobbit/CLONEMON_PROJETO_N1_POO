package br.clonemon.web.dto;

import br.clonemon.domain.Element;
import br.clonemon.domain.Species;

import java.util.List;

public record SpeciesDto(long id, String name, Element element, int baseHp, int baseAtk, int baseDef, int baseSpd,
                         List<MoveDto> moves) {

    public static SpeciesDto of(Species s) {
        return new SpeciesDto(s.id(), s.name(), s.element(), s.baseHp(), s.baseAtk(), s.baseDef(), s.baseSpd(),
                MoveDto.of(s));
    }
}
