package br.clonemon.infrastructure.persistence;

import br.clonemon.application.NotFoundException;
import br.clonemon.application.port.WorldRepository;
import br.clonemon.domain.WorldPosition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/** A posicao fica em colunas de {@code trainer}; as vitorias, em {@code trainer_npc_defeat} (so ids, sem entidade). */
@Repository
class JpaWorldRepository implements WorldRepository {

    interface Jpa extends JpaRepository<TrainerEntity, Long> {
        @Query(value = "select npc_id from trainer_npc_defeat where trainer_id = ?1 order by defeated_at, npc_id",
                nativeQuery = true)
        List<String> findDefeatedNpcIds(long trainerId);

        @Query(value = "select exists (select 1 from trainer_npc_defeat where trainer_id = ?1 and npc_id = ?2)",
                nativeQuery = true)
        boolean hasDefeated(long trainerId, String npcId);

        @Transactional
        @Modifying
        @Query(value = "insert into trainer_npc_defeat (trainer_id, npc_id) values (?1, ?2) on conflict do nothing",
                nativeQuery = true)
        void recordDefeat(long trainerId, String npcId);
    }

    private final Jpa jpa;

    JpaWorldRepository(Jpa jpa) { this.jpa = jpa; }

    @Override
    public Optional<WorldPosition> findPosition(long trainerId) {
        return jpa.findById(trainerId).flatMap(TrainerEntity::getWorldPosition);
    }

    @Override
    public void savePosition(long trainerId, WorldPosition position) {
        TrainerEntity t = jpa.findById(trainerId).orElseThrow(() -> new NotFoundException("Trainer not found: " + trainerId));
        t.moveTo(position);
        jpa.save(t);
    }

    @Override
    public List<String> findDefeatedNpcs(long trainerId) {
        return jpa.findDefeatedNpcIds(trainerId);
    }

    @Override
    public boolean hasDefeated(long trainerId, String npcId) {
        return jpa.hasDefeated(trainerId, npcId);
    }

    @Override
    public void recordDefeat(long trainerId, String npcId) {
        jpa.recordDefeat(trainerId, npcId);
    }
}
