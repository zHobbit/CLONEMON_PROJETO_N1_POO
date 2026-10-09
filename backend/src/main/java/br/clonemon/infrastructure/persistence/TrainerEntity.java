package br.clonemon.infrastructure.persistence;

import br.clonemon.domain.Trainer;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "trainer")
class TrainerEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    protected TrainerEntity() {}

    TrainerEntity(Trainer t) {
        this.id = t.id();
        this.username = t.username();
        this.passwordHash = t.passwordHash();
    }

    Trainer toDomain() {
        return new Trainer(id, username, passwordHash);
    }
}
