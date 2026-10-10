package br.clonemon.application.port;

import br.clonemon.domain.Battle;

import java.util.List;
import java.util.Optional;

public interface BattleRepository {

    /** Forma persistida de uma batalha: estado bruto, sem calculadora nem IA. {@code npcId} nulo = selvagem. */
    record StoredBattle(Long id, long trainerId, String npcId, List<Long> playerMonsterIds, Battle.State state) {
        public StoredBattle {
            playerMonsterIds = List.copyOf(playerMonsterIds);
        }
    }

    StoredBattle save(StoredBattle battle);

    Optional<StoredBattle> findById(long id);

    Optional<StoredBattle> findActiveByTrainer(long trainerId);
}
