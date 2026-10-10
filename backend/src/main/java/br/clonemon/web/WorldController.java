package br.clonemon.web;

import br.clonemon.application.WorldService;
import br.clonemon.web.dto.WorldDtos.PositionDto;
import br.clonemon.web.dto.WorldDtos.WorldDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import static br.clonemon.web.security.TokenService.trainerId;

@RestController
@RequestMapping("/api/world")
class WorldController {
    private final WorldService world;

    WorldController(WorldService world) { this.world = world; }

    @GetMapping
    WorldDto world(@AuthenticationPrincipal Jwt jwt) {
        return WorldDto.of(world.world(trainerId(jwt)));
    }

    @PutMapping("/position")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void move(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody PositionDto position) {
        world.move(trainerId(jwt), position.toDomain());
    }
}
