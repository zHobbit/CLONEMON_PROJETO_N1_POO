package br.clonemon.application.port;

import br.clonemon.domain.Trainer;

import java.util.Optional;

public interface TrainerRepository {
    Trainer save(Trainer trainer);

    Optional<Trainer> findByUsername(String username);

    boolean existsByUsername(String username);
}
