package br.clonemon.application;

import br.clonemon.application.port.ReplayRepository;
import br.clonemon.application.port.ReplayRepository.Replay;
import br.clonemon.application.port.ReplayRepository.Summary;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Leitura dos replays: so os do proprio treinador e so de batalhas terminadas. */
@Service
@Transactional(readOnly = true)
public class ReplayService {

    private final ReplayRepository replays;

    public ReplayService(ReplayRepository replays) { this.replays = replays; }

    public List<Summary> list(long trainerId) {
        return replays.listFinished(trainerId, BattleService.REPLAYS_KEPT);
    }

    public Replay get(long trainerId, long battleId) {
        return replays.findFinished(trainerId, battleId)
                .orElseThrow(() -> new NotFoundException("Replay not found: " + battleId));
    }
}
