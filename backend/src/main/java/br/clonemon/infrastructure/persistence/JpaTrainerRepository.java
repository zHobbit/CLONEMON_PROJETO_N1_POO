package br.clonemon.infrastructure.persistence;

import br.clonemon.application.port.TrainerRepository;
import br.clonemon.domain.Trainer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
class JpaTrainerRepository implements TrainerRepository {

    interface Jpa extends JpaRepository<TrainerEntity, Long> {
        Optional<TrainerEntity> findByUsername(String username);

        boolean existsByUsername(String username);
    }

    private final Jpa jpa;

    JpaTrainerRepository(Jpa jpa) { this.jpa = jpa; }

    @Override
    public Trainer save(Trainer trainer) {
        return jpa.save(new TrainerEntity(trainer)).toDomain();
    }

    @Override
    public Optional<Trainer> findByUsername(String username) {
        return jpa.findByUsername(username).map(TrainerEntity::toDomain);
    }

    @Override
    public boolean existsByUsername(String username) {
        return jpa.existsByUsername(username);
    }
}
