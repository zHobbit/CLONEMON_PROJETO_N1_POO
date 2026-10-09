package br.clonemon.application.port;

import br.clonemon.domain.Species;

import java.util.List;
import java.util.Optional;

public interface SpeciesCatalog {
    List<Species> findAll();

    Optional<Species> findById(long id);
}
