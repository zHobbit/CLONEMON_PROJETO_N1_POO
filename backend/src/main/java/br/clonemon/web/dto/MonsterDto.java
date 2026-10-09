package br.clonemon.web.dto;

import br.clonemon.application.OwnedMonster;
import br.clonemon.domain.Element;
import br.clonemon.domain.ExperienceCurve;
import br.clonemon.domain.Monster;

import java.util.List;

public record MonsterDto(long id, long speciesId, String species, String nickname, Element element, int level,
                         int xp, int xpNextLevel, int currentHp, int maxHp, int attack, int defense, int speed,
                         Integer teamSlot, List<MoveDto> moves) {

    public static MonsterDto of(OwnedMonster o) {
        Monster m = o.monster();
        int next = m.level() >= ExperienceCurve.MAX_LEVEL ? m.xp() : ExperienceCurve.xpForLevel(m.level() + 1);
        return new MonsterDto(o.id(), m.species().id(), m.species().name(), o.nickname(), m.species().element(),
                m.level(), m.xp(), next, m.currentHp(), m.maxHp(), m.attack(), m.defense(), m.speed(),
                o.teamSlot(), MoveDto.of(m));
    }
}
