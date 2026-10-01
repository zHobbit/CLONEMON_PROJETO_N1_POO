package br.clonemon.infrastructure.persistence;

import br.clonemon.application.NotFoundException;
import br.clonemon.application.OwnedMonster;
import br.clonemon.application.port.MonsterRepository;
import br.clonemon.application.port.SpeciesCatalog;
import br.clonemon.domain.Monster;
import br.clonemon.domain.Species;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
class JpaMonsterRepository implements MonsterRepository {

    interface Jpa extends JpaRepository<MonsterEntity, Long> {
        @EntityGraph(attributePaths = "pp")
        List<MonsterEntity> findByTrainerIdOrderByIdAsc(long trainerId);
    }

    private final Jpa jpa;
    private final SpeciesCatalog catalog;

    JpaMonsterRepository(Jpa jpa, SpeciesCatalog catalog) {
        this.jpa = jpa;
        this.catalog = catalog;
    }

    @Override
    public List<OwnedMonster> findByTrainer(long trainerId) {
        return jpa.findByTrainerIdOrderByIdAsc(trainerId).stream().map(this::toDomain).toList();
    }

    @Override
    public OwnedMonster save(OwnedMonster monster) {
        MonsterEntity e = monster.id() == null
                ? MonsterEntity.create()
                : jpa.findById(monster.id()).orElseThrow(() -> new NotFoundException("Monster not found: " + monster.id()));
        e.apply(monster);
        return toDomain(jpa.save(e));
    }

    @Override
    public List<OwnedMonster> saveAll(List<OwnedMonster> monsters) {
        return monsters.stream().map(this::save).toList();
    }

    private OwnedMonster toDomain(MonsterEntity e) {
        Species species = catalog.findById(e.getSpeciesId())
                .orElseThrow(() -> new IllegalStateException("Unknown species " + e.getSpeciesId()));
        Monster monster = Monster.restore(species, e.getXp(), e.getCurrentHp(), e.getPp());
        return new OwnedMonster(e.getId(), e.getTrainerId(), e.getNickname(), e.getTeamSlot(), monster);
    }
}
