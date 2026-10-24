package br.clonemon.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.ColumnTransformer;

import java.time.Instant;

@Entity
@Table(name = "battle_replay")
class ReplayEntity {
    @Id
    @Column(name = "battle_id")
    private long battleId;

    @Column(name = "trainer_id", nullable = false, updatable = false)
    private long trainerId;

    @Column(nullable = false, length = 40, updatable = false)
    private String opponent;

    @Column(nullable = false, length = 20, updatable = false)
    private String lead;

    @Column(name = "turn_count", nullable = false)
    private int turnCount;

    @Column(length = 12)
    private String result;

    @Column(name = "started_at", nullable = false, updatable = false)
    private Instant startedAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    /** JSON de {@code ReplayRepository.Snapshot}; o cast grava como jsonb. */
    @Column(nullable = false, columnDefinition = "jsonb", updatable = false)
    @ColumnTransformer(write = "?::jsonb")
    private String snapshot;

    /** Array JSON de {@code ReplayRepository.Turn}. */
    @Column(nullable = false, columnDefinition = "jsonb")
    @ColumnTransformer(write = "?::jsonb")
    private String turns;

    protected ReplayEntity() {}

    ReplayEntity(long battleId, long trainerId, String opponent, String lead, String snapshot) {
        this.battleId = battleId;
        this.trainerId = trainerId;
        this.opponent = opponent;
        this.lead = lead;
        this.snapshot = snapshot;
        this.turns = "[]";
        this.startedAt = Instant.now();
    }

    long getBattleId() { return battleId; }
    long getTrainerId() { return trainerId; }
    String getOpponent() { return opponent; }
    String getLead() { return lead; }
    int getTurnCount() { return turnCount; }
    String getResult() { return result; }
    Instant getFinishedAt() { return finishedAt; }
    String getSnapshot() { return snapshot; }
    String getTurns() { return turns; }

    void setTurns(String turns, int count) {
        this.turns = turns;
        this.turnCount = count;
    }

    void finish(String result, Instant at) {
        this.result = result;
        this.finishedAt = at;
    }
}
