package br.clonemon.web.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

@ConfigurationProperties("clonemon.jwt")
public record JwtProperties(String secret, Duration ttl) {
    public JwtProperties {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32)
            throw new IllegalArgumentException("clonemon.jwt.secret must be at least 32 bytes for HS256");
        if (ttl == null || ttl.isNegative() || ttl.isZero())
            throw new IllegalArgumentException("clonemon.jwt.ttl must be positive");
    }
}
