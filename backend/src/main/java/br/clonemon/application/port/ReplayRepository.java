package br.clonemon.application.port;

import br.clonemon.domain.Battle;
import br.clonemon.domain.Element;
import br.clonemon.domain.Monster;
import br.clonemon.domain.StatusCondition;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/** Replays de batalhas: retrato inicial dos times e os eventos de cada turno. */
public interface ReplayRepository {

    /** Monstro como estava no inicio da batalha (sem golpes). */
    record Combatant(long speciesId, String name, Element element, int level, int currentHp, int maxHp,
                     StatusCondition status) {
        public static Combatant of(Monster m) {
            return new Combatant(m.species().id(), m.species().name(), m.species().element(), m.level(),
                    m.currentHp(), m.maxHp(), m.status());
        }
    }

    /** Times completos no inicio. {@code npcName} e nulo contra selvagem. */
    record Snapshot(List<Combatant> playerTeam, List<Combatant> enemyTeam, int playerActive, int enemyActive,
                    String npcName) {
        public Snapshot {
            playerTeam = List.copyOf(playerTeam);
            enemyTeam = List.copyOf(enemyTeam);
        }

        /** Monstro que comecou a batalha. */
        public String lead() { return playerTeam.get(playerActive).name(); }
    }

    /** Nivel e HP maximo de um monstro do jogador depois do turno (muda ao subir de nivel). */
    record Growth(int level, int maxHp) {}

    record Turn(List<Battle.Event> events, List<Growth> playerTeam) {
        public Turn {
            events = List.copyOf(events);
            playerTeam = List.copyOf(playerTeam);
        }
    }

    record Summary(long id, Instant finishedAt, String opponent, String lead, Battle.Status result, int turnCount) {}

    record Replay(Summary summary, Snapshot snapshot, List<Turn> turns) {}

    void start(long battleId, long trainerId, String opponent, Snapshot snapshot);

    void appendTurn(long battleId, Turn turn);

    void finish(long battleId, Battle.Status result);

    /** Apaga os replays terminados do treinador alem dos {@code keep} mais novos. */
    void prune(long trainerId, int keep);

    /** Terminados, do mais novo para o mais antigo. */
    List<Summary> listFinished(long trainerId, int limit);

    Optional<Replay> findFinished(long trainerId, long battleId);
}
