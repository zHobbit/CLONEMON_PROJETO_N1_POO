package br.clonemon.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import org.hibernate.annotations.ColumnTransformer;

@Entity
@Table(name = "battle")
class BattleEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trainer_id", nullable = false)
    private long trainerId;

    @Column(nullable = false, length = 20)
    private String status;

    /** JSON serializado por {@link JpaBattleRepository}; o cast grava como jsonb. */
    @Column(nullable = false, columnDefinition = "jsonb")
    @ColumnTransformer(write = "?::jsonb")
    private String state;

    /** Bloqueio otimista: dois turnos simultaneos na mesma batalha geram conflito. */
    @Version
    private int version;

    protected BattleEntity() {}

    BattleEntity(long trainerId) { this.trainerId = trainerId; }

    Long getId() { return id; }
    long getTrainerId() { return trainerId; }
    String getStatus() { return status; }
    String getState() { return state; }

    void update(String status, String state) {
        this.status = status;
        this.state = state;
    }
}
