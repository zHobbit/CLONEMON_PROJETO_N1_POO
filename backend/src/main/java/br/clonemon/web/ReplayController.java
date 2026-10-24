package br.clonemon.web;

import br.clonemon.application.ReplayService;
import br.clonemon.application.port.ReplayRepository.Summary;
import br.clonemon.web.dto.ReplayDtos.ReplayDto;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static br.clonemon.web.security.TokenService.trainerId;

@RestController
@RequestMapping("/api/replays")
class ReplayController {

    private final ReplayService replays;

    ReplayController(ReplayService replays) { this.replays = replays; }

    /** As batalhas terminadas mais recentes do treinador (ate 20), da mais nova para a mais antiga. */
    @GetMapping
    List<Summary> list(@AuthenticationPrincipal Jwt jwt) {
        return replays.list(trainerId(jwt));
    }

    /** O replay completo; 404 se nao existe, se e de outro treinador ou se a batalha nao terminou. */
    @GetMapping("/{id}")
    ReplayDto get(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
        return ReplayDto.of(replays.get(trainerId(jwt), id));
    }
}
