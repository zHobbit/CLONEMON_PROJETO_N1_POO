package br.clonemon.application;

import br.clonemon.application.port.TrainerRepository;
import br.clonemon.domain.Trainer;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@Transactional
public class AuthService {
    private final TrainerRepository trainers;
    private final PasswordEncoder encoder;

    public AuthService(TrainerRepository trainers, PasswordEncoder encoder) {
        this.trainers = trainers;
        this.encoder = encoder;
    }

    public Trainer register(String username, String rawPassword) {
        String name = normalize(username);
        if (trainers.existsByUsername(name)) throw new ConflictException("Username already taken");
        return trainers.save(new Trainer(null, name, encoder.encode(rawPassword)));
    }

    @Transactional(readOnly = true)
    public Trainer authenticate(String username, String rawPassword) {
        return trainers.findByUsername(normalize(username))
                .filter(t -> encoder.matches(rawPassword, t.passwordHash()))
                .orElseThrow(InvalidCredentialsException::new);
    }

    private static String normalize(String username) {
        return username.trim().toLowerCase(Locale.ROOT);
    }
}
