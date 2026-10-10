package br.clonemon.application;

import br.clonemon.application.port.WorldRepository;
import br.clonemon.domain.WorldPosition;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class WorldService {

    /** Progresso no mapa. {@code position} e nula ate o treinador salvar uma (o mapa tem um ponto de partida). */
    public record World(WorldPosition position, List<String> defeatedNpcs) {
        public World {
            defeatedNpcs = List.copyOf(defeatedNpcs);
        }
    }

    private final WorldRepository world;

    public WorldService(WorldRepository world) { this.world = world; }

    @Transactional(readOnly = true)
    public World world(long trainerId) {
        return new World(world.findPosition(trainerId).orElse(null), world.findDefeatedNpcs(trainerId));
    }

    public void move(long trainerId, WorldPosition position) {
        world.savePosition(trainerId, position);
    }
}
