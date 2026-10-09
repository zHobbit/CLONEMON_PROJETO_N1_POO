package br.clonemon.web.security;

import br.clonemon.domain.Trainer;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;

@Service
public class TokenService {
    private final JwtEncoder encoder;
    private final JwtProperties props;
    private final Clock clock = Clock.systemUTC();

    public TokenService(JwtEncoder encoder, JwtProperties props) {
        this.encoder = encoder;
        this.props = props;
    }

    public record IssuedToken(String token, Instant expiresAt) {}

    public IssuedToken issue(Trainer trainer) {
        Instant now = clock.instant();
        Instant expires = now.plus(props.ttl());
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("clonemon")
                .subject(String.valueOf(trainer.id()))
                .claim("username", trainer.username())
                .issuedAt(now)
                .expiresAt(expires)
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return new IssuedToken(encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue(), expires);
    }

    /** O subject do token e o id do treinador. */
    public static long trainerId(Jwt jwt) {
        return Long.parseLong(jwt.getSubject());
    }
}
