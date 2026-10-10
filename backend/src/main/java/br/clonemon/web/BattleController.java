package br.clonemon.web;

import br.clonemon.application.BattleService;
import br.clonemon.application.NotFoundException;
import br.clonemon.web.dto.BattleDtos.BattleDto;
import br.clonemon.web.dto.BattleDtos.StartRequest;
import br.clonemon.web.dto.BattleDtos.TurnRequest;
import br.clonemon.web.dto.BattleDtos.TurnResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import static br.clonemon.web.security.TokenService.trainerId;

@RestController
@RequestMapping("/api/battles")
class BattleController {
    private final BattleService battles;

    BattleController(BattleService battles) { this.battles = battles; }

    /** Sem corpo (ou sem {@code npcId}): selvagem. Com {@code npcId}: desafia o treinador do mapa. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    BattleDto start(@AuthenticationPrincipal Jwt jwt, @RequestBody(required = false) StartRequest req) {
        long trainer = trainerId(jwt);
        return BattleDto.of(req == null || req.npcId() == null ? battles.start(trainer) : battles.challenge(trainer, req.npcId()));
    }

    @GetMapping("/active")
    BattleDto active(@AuthenticationPrincipal Jwt jwt) {
        return battles.active(trainerId(jwt)).map(BattleDto::of)
                .orElseThrow(() -> new NotFoundException("No active battle"));
    }

    @GetMapping("/{id}")
    BattleDto get(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
        return BattleDto.of(battles.get(trainerId(jwt), id));
    }

    @PostMapping("/{id}/turns")
    TurnResponse turn(@AuthenticationPrincipal Jwt jwt, @PathVariable long id, @Valid @RequestBody TurnRequest req) {
        return TurnResponse.of(battles.submitTurn(trainerId(jwt), id, req.toAction()));
    }
}
