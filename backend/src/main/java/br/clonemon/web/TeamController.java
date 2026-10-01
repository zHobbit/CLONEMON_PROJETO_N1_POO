package br.clonemon.web;

import br.clonemon.application.TeamService;
import br.clonemon.web.dto.MonsterDto;
import br.clonemon.web.dto.TeamDtos.RosterDto;
import br.clonemon.web.dto.TeamDtos.StarterRequest;
import br.clonemon.web.dto.TeamDtos.TeamUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import static br.clonemon.web.security.TokenService.trainerId;

@RestController
@RequestMapping("/api/team")
class TeamController {
    private final TeamService teams;

    TeamController(TeamService teams) { this.teams = teams; }

    @GetMapping
    RosterDto roster(@AuthenticationPrincipal Jwt jwt) {
        return RosterDto.of(teams.roster(trainerId(jwt)));
    }

    @PutMapping
    RosterDto update(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody TeamUpdateRequest req) {
        return RosterDto.of(teams.updateTeam(trainerId(jwt), req.monsterIds()));
    }

    @PostMapping("/starter")
    @ResponseStatus(HttpStatus.CREATED)
    MonsterDto starter(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody StarterRequest req) {
        return MonsterDto.of(teams.chooseStarter(trainerId(jwt), req.speciesId()));
    }

    @PostMapping("/heal")
    RosterDto heal(@AuthenticationPrincipal Jwt jwt) {
        return RosterDto.of(teams.healAll(trainerId(jwt)));
    }
}
