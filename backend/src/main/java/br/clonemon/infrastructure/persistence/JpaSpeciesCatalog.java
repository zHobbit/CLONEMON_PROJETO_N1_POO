package br.clonemon.infrastructure.persistence;

import br.clonemon.application.port.SpeciesCatalog;
import br.clonemon.domain.Species;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Especies nunca mudam em tempo de execucao, entao sao carregadas uma vez e mantidas em memoria. */
@Repository
class JpaSpeciesCatalog implements SpeciesCatalog {

    interface Jpa extends JpaRepository<SpeciesEntity, Long> {
        List<SpeciesEntity> findAllByOrderByIdAsc();
    }

    private final Jpa jpa;
    private volatile Map<Long, Species> cache;

    JpaSpeciesCatalog(Jpa jpa) { this.jpa = jpa; }

    @Override
    public List<Species> findAll() {
        return List.copyOf(species().values());
    }

    @Override
    public Optional<Species> findById(long id) {
        return Optional.ofNullable(species().get(id));
    }

    private Map<Long, Species> species() {
        Map<Long, Species> c = cache;
        if (c == null) {
            c = jpa.findAllByOrderByIdAsc().stream().map(SpeciesEntity::toDomain)
                    .collect(Collectors.toMap(Species::id, Function.identity(), (a, b) -> a, LinkedHashMap::new));
            cache = c;
        }
        return c;
    }
}
