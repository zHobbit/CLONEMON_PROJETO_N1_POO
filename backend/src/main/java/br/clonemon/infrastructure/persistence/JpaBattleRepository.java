package br.clonemon.infrastructure.persistence;

import br.clonemon.application.NotFoundException;
import br.clonemon.application.port.BattleRepository;
import br.clonemon.application.port.SpeciesCatalog;
import br.clonemon.domain.Battle;
import br.clonemon.domain.Monster;
import br.clonemon.domain.Stat;
import br.clonemon.domain.StatusCondition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Repository
class JpaBattleRepository implements BattleRepository {

    interface Jpa extends JpaRepository<BattleEntity, Long> {
        Optional<BattleEntity> findByTrainerIdAndStatus(long trainerId, String status);
    }

    /**
     * Monstro dentro da batalha. Status, sono e estagios vieram depois: batalhas salvas antes deles
     * nao tem esses campos e carregam como nulos, ou seja, sem status e com estagios zerados.
     */
    record MonsterJson(long speciesId, int xp, int hp, int[] pp,
                       StatusCondition status, Integer sleepTurns, Map<Stat, Integer> stages) {}

    record StateJson(List<Long> playerMonsterIds, List<MonsterJson> player, List<MonsterJson> enemy,
                     int playerActive, int enemyActive, List<String> log) {}

    private final Jpa jpa;
    private final SpeciesCatalog catalog;
    private final JsonMapper json;

    JpaBattleRepository(Jpa jpa, SpeciesCatalog catalog, JsonMapper json) {
        this.jpa = jpa;
        this.catalog = catalog;
        this.json = json;
    }

    @Override
    public StoredBattle save(StoredBattle b) {
        BattleEntity e = b.id() == null
                ? new BattleEntity(b.trainerId())
                : jpa.findById(b.id()).orElseThrow(() -> new NotFoundException("Battle not found: " + b.id()));
        Battle.State s = b.state();
        StateJson payload = new StateJson(b.playerMonsterIds(), toJson(s.playerTeam()), toJson(s.enemyTeam()),
                s.playerActive(), s.enemyActive(), s.log());
        e.update(s.status().name(), json.writeValueAsString(payload));
        BattleEntity saved = jpa.save(e);
        return new StoredBattle(saved.getId(), b.trainerId(), b.playerMonsterIds(), s);
    }

    @Override
    public Optional<StoredBattle> findById(long id) {
        return jpa.findById(id).map(this::toStored);
    }

    @Override
    public Optional<StoredBattle> findActiveByTrainer(long trainerId) {
        return jpa.findByTrainerIdAndStatus(trainerId, Battle.Status.AWAITING_ACTION.name()).map(this::toStored);
    }

    private StoredBattle toStored(BattleEntity e) {
        StateJson p = json.readValue(e.getState(), StateJson.class);
        Battle.State state = new Battle.State(fromJson(p.player()), fromJson(p.enemy()), p.playerActive(), p.enemyActive(),
                Battle.Status.valueOf(e.getStatus()), p.log());
        return new StoredBattle(e.getId(), e.getTrainerId(), p.playerMonsterIds(), state);
    }

    private static List<MonsterJson> toJson(List<Monster> team) {
        return team.stream().map(m -> new MonsterJson(m.species().id(), m.xp(), m.currentHp(), m.ppSnapshot(),
                m.status(), m.sleepTurns(), m.stages())).toList();
    }

    private List<Monster> fromJson(List<MonsterJson> team) {
        return team.stream().map(this::fromJson).toList();
    }

    private Monster fromJson(MonsterJson j) {
        Monster m = Monster.restore(
                catalog.findById(j.speciesId()).orElseThrow(() -> new IllegalStateException("Unknown species " + j.speciesId())),
                j.xp(), j.hp(), j.pp());
        m.restoreBattleState(Objects.requireNonNullElse(j.status(), StatusCondition.NONE),
                Objects.requireNonNullElse(j.sleepTurns(), 0),
                Objects.requireNonNullElse(j.stages(), Map.of()));
        return m;
    }
}
