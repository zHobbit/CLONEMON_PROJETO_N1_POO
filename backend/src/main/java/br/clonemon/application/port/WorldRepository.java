package br.clonemon.application.port;

import br.clonemon.domain.WorldPosition;

import java.util.List;
import java.util.Optional;

/** Progresso do treinador no mapa: onde ele esta e quais NPCs ja derrotou. */
public interface WorldRepository {
    /** Vazio ate o treinador salvar uma posicao. */
    Optional<WorldPosition> findPosition(long trainerId);

    void savePosition(long trainerId, WorldPosition position);

    /** Ids dos NPCs derrotados, na ordem das vitorias. */
    List<String> findDefeatedNpcs(long trainerId);

    boolean hasDefeated(long trainerId, String npcId);

    /** Idempotente: registrar de novo a mesma vitoria nao muda nada. */
    void recordDefeat(long trainerId, String npcId);
}
