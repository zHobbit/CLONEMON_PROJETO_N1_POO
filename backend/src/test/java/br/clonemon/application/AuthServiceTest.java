package br.clonemon.application;

import br.clonemon.domain.Trainer;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuthServiceTest {

    private final AuthService auth = new AuthService(new InMemoryPorts.Trainers(),
            PasswordEncoderFactories.createDelegatingPasswordEncoder());

    @Test
    void registerNormalizesUsernameAndHashesPassword() {
        Trainer t = auth.register("  Ash_Ketchum ", "pikachu123");
        assertThat(t.id()).isNotNull();
        assertThat(t.username()).isEqualTo("ash_ketchum");
        assertThat(t.passwordHash()).isNotEqualTo("pikachu123").startsWith("{bcrypt}");
    }

    @Test
    void duplicateUsernameIsRejectedIgnoringCase() {
        auth.register("misty", "starmie1");
        assertThatThrownBy(() -> auth.register("MISTY", "other123")).isInstanceOf(ConflictException.class);
    }

    @Test
    void authenticateWithCorrectPassword() {
        Trainer registered = auth.register("brock", "onix1234");
        assertThat(auth.authenticate("Brock", "onix1234").id()).isEqualTo(registered.id());
    }

    @Test
    void wrongPasswordOrUnknownUserFails() {
        auth.register("gary", "eevee123");
        assertThatThrownBy(() -> auth.authenticate("gary", "wrong")).isInstanceOf(InvalidCredentialsException.class);
        assertThatThrownBy(() -> auth.authenticate("nobody", "eevee123")).isInstanceOf(InvalidCredentialsException.class);
    }
}
