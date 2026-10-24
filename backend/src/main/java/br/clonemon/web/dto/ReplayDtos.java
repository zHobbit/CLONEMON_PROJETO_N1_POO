package br.clonemon.web.dto;

import br.clonemon.application.port.ReplayRepository.Replay;
import br.clonemon.application.port.ReplayRepository.Snapshot;
import br.clonemon.application.port.ReplayRepository.Turn;
import br.clonemon.domain.Battle;

import java.time.Instant;
import java.util.List;

public final class ReplayDtos {
    private ReplayDtos() {}

    /** Os campos do item da lista mais o retrato inicial e os turnos. */
    public record ReplayDto(long id, Instant finishedAt, String opponent, String lead, Battle.Status result,
                            int turnCount, Snapshot snapshot, List<Turn> turns) {
        public static ReplayDto of(Replay r) {
            var s = r.summary();
            return new ReplayDto(s.id(), s.finishedAt(), s.opponent(), s.lead(), s.result(), s.turnCount(),
                    r.snapshot(), r.turns());
        }
    }
}
