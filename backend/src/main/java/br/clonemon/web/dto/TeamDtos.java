package br.clonemon.web.dto;

import br.clonemon.application.TeamService;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class TeamDtos {
    private TeamDtos() {}

    public record RosterDto(List<MonsterDto> team, List<MonsterDto> box) {
        public static RosterDto of(TeamService.Roster r) {
            return new RosterDto(r.team().stream().map(MonsterDto::of).toList(), r.box().stream().map(MonsterDto::of).toList());
        }
    }

    public record TeamUpdateRequest(@NotNull @Size(min = 1, max = 6) List<@NotNull Long> monsterIds) {}

    public record StarterRequest(@NotNull Long speciesId) {}
}
