package br.clonemon.infrastructure.persistence;

import br.clonemon.application.NotFoundException;
import br.clonemon.application.port.ReplayRepository;
import br.clonemon.domain.Battle;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
class JpaReplayRepository implements ReplayRepository {

    interface Jpa extends JpaRepository<ReplayEntity, Long> {
        List<ReplayEntity> findByTrainerIdAndFinishedAtNotNullOrderByFinishedAtDescBattleIdDesc(long trainerId, Limit limit);

        Optional<ReplayEntity> findByBattleIdAndTrainerIdAndFinishedAtNotNull(long battleId, long trainerId);
    }

    private static final TypeReference<List<Turn>> TURNS = new TypeReference<>() {};

    private final Jpa jpa;
    private final JsonMapper json;

    JpaReplayRepository(Jpa jpa, JsonMapper json) {
        this.jpa = jpa;
        this.json = json;
    }

    @Override
    public void start(long battleId, long trainerId, String opponent, Snapshot snapshot) {
        jpa.save(new ReplayEntity(battleId, trainerId, opponent, snapshot.lead(), json.writeValueAsString(snapshot)));
    }

    @Override
    @Transactional
    public void appendTurn(long battleId, Turn turn) {
        ReplayEntity e = entity(battleId);
        List<Turn> turns = new ArrayList<>(json.readValue(e.getTurns(), TURNS));
        turns.add(turn);
        e.setTurns(json.writeValueAsString(turns), turns.size());
        jpa.save(e);
    }

    @Override
    @Transactional
    public void finish(long battleId, Battle.Status result) {
        ReplayEntity e = entity(battleId);
        e.finish(result.name(), Instant.now());
        jpa.save(e);
    }

    @Override
    @Transactional
    public void prune(long trainerId, int keep) {
        List<ReplayEntity> finished = jpa.findByTrainerIdAndFinishedAtNotNullOrderByFinishedAtDescBattleIdDesc(trainerId, Limit.unlimited());
        if (finished.size() > keep) jpa.deleteAll(finished.subList(keep, finished.size()));
    }

    @Override
    public List<Summary> listFinished(long trainerId, int limit) {
        return jpa.findByTrainerIdAndFinishedAtNotNullOrderByFinishedAtDescBattleIdDesc(trainerId, Limit.of(limit))
                .stream().map(JpaReplayRepository::summary).toList();
    }

    @Override
    public Optional<Replay> findFinished(long trainerId, long battleId) {
        return jpa.findByBattleIdAndTrainerIdAndFinishedAtNotNull(battleId, trainerId)
                .map(e -> new Replay(summary(e), json.readValue(e.getSnapshot(), Snapshot.class), json.readValue(e.getTurns(), TURNS)));
    }

    private ReplayEntity entity(long battleId) {
        return jpa.findById(battleId).orElseThrow(() -> new NotFoundException("Replay not found: " + battleId));
    }

    private static Summary summary(ReplayEntity e) {
        return new Summary(e.getBattleId(), e.getFinishedAt(), e.getOpponent(), e.getLead(),
                Battle.Status.valueOf(e.getResult()), e.getTurnCount());
    }
}
