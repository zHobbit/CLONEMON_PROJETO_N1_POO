package br.clonemon.application;

import br.clonemon.domain.WorldPosition;
import br.clonemon.domain.WorldPosition.Facing;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class WorldServiceTest {
    private static final long TRAINER = 1L;

    private final InMemoryPorts.World repo = new InMemoryPorts.World();
    private final WorldService service = new WorldService(repo);

    @Test
    void newTrainerHasNoPositionNorDefeats() {
        WorldService.World w = service.world(TRAINER);
        assertThat(w.position()).isNull();
        assertThat(w.defeatedNpcs()).isEmpty();
    }

    @Test
    void savedPositionAndDefeatsAreReturned() {
        service.move(TRAINER, new WorldPosition(3, 4, Facing.UP));
        service.move(TRAINER, new WorldPosition(3, 5, Facing.DOWN));
        repo.recordDefeat(TRAINER, "caio");

        WorldService.World w = service.world(TRAINER);

        assertThat(w.position()).isEqualTo(new WorldPosition(3, 5, Facing.DOWN));
        assertThat(w.defeatedNpcs()).containsExactly("caio");
        assertThat(service.world(2L).position()).isNull();
    }
}
