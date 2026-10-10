package br.clonemon.application.port;

import br.clonemon.domain.NpcTrainer;

import java.util.List;
import java.util.Optional;

/** Treinadores do mapa: dados fixos, como as especies. */
public interface NpcCatalog {
    List<NpcTrainer> findAll();

    Optional<NpcTrainer> findById(String id);
}
