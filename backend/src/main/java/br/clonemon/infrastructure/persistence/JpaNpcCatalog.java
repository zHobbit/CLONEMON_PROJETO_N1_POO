package br.clonemon.infrastructure.persistence;

import br.clonemon.application.port.NpcCatalog;
import br.clonemon.application.port.SpeciesCatalog;
import br.clonemon.domain.NpcTrainer;
import br.clonemon.domain.Species;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Como as especies, os NPCs nunca mudam em tempo de execucao: carregados uma vez e mantidos em memoria. */
@Repository
class JpaNpcCatalog implements NpcCatalog {

    interface Jpa extends JpaRepository<NpcTrainerEntity, String> {}

    private final Jpa jpa;
    private final SpeciesCatalog species;
    private volatile Map<String, NpcTrainer> cache;

    JpaNpcCatalog(Jpa jpa, SpeciesCatalog species) {
        this.jpa = jpa;
        this.species = species;
    }

    @Override
    public List<NpcTrainer> findAll() {
        return List.copyOf(npcs().values());
    }

    @Override
    public Optional<NpcTrainer> findById(String id) {
        return Optional.ofNullable(npcs().get(id));
    }

    private Map<String, NpcTrainer> npcs() {
        Map<String, NpcTrainer> c = cache;
        if (c == null) {
            c = jpa.findAll(Sort.by("id")).stream().map(e -> e.toDomain(this::species))
                    .collect(Collectors.toMap(NpcTrainer::id, Function.identity(), (a, b) -> a, LinkedHashMap::new));
            cache = c;
        }
        return c;
    }

    private Species species(long id) {
        return species.findById(id).orElseThrow(() -> new IllegalStateException("Unknown species " + id));
    }
}
