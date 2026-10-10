package br.clonemon.infrastructure.persistence;

import br.clonemon.domain.Trainer;
import br.clonemon.domain.WorldPosition;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.Optional;

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

    /** Posicao no mapa: as tres colunas sao nulas juntas, ate a primeira vez que o treinador salva. */
    @Column(name = "world_x")
    private Integer worldX;

    @Column(name = "world_y")
    private Integer worldY;

    @Enumerated(EnumType.STRING)
    @Column(name = "world_facing", length = 5)
    private WorldPosition.Facing worldFacing;

    protected TrainerEntity() {}

    TrainerEntity(Trainer t) {
        this.id = t.id();
        this.username = t.username();
        this.passwordHash = t.passwordHash();
    }

    Trainer toDomain() {
        return new Trainer(id, username, passwordHash);
    }

    Optional<WorldPosition> getWorldPosition() {
        return worldFacing == null ? Optional.empty() : Optional.of(new WorldPosition(worldX, worldY, worldFacing));
    }

    void moveTo(WorldPosition p) {
        worldX = p.x();
        worldY = p.y();
        worldFacing = p.facing();
    }
}
