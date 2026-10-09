package br.clonemon.web;

import br.clonemon.application.AuthService;
import br.clonemon.domain.Trainer;
import br.clonemon.web.dto.AuthDtos.LoginRequest;
import br.clonemon.web.dto.AuthDtos.RegisterRequest;
import br.clonemon.web.dto.AuthDtos.TokenResponse;
import br.clonemon.web.security.TokenService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
class AuthController {
    private final AuthService auth;
    private final TokenService tokens;

    AuthController(AuthService auth, TokenService tokens) {
        this.auth = auth;
        this.tokens = tokens;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    TokenResponse register(@Valid @RequestBody RegisterRequest req) {
        return respond(auth.register(req.username(), req.password()));
    }

    @PostMapping("/login")
    TokenResponse login(@Valid @RequestBody LoginRequest req) {
        return respond(auth.authenticate(req.username(), req.password()));
    }

    private TokenResponse respond(Trainer t) {
        TokenService.IssuedToken token = tokens.issue(t);
        return new TokenResponse(token.token(), t.username(), token.expiresAt());
    }
}
