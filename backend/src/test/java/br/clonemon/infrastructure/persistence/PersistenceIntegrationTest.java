package br.clonemon.infrastructure.persistence;

import br.clonemon.TestcontainersConfiguration;
import br.clonemon.application.OwnedMonster;
import br.clonemon.application.port.BattleRepository;
import br.clonemon.application.port.BattleRepository.StoredBattle;
import br.clonemon.application.port.MonsterRepository;
import br.clonemon.application.port.SpeciesCatalog;
import br.clonemon.application.port.TrainerRepository;
import br.clonemon.domain.Battle;
import br.clonemon.domain.Catalog;
import br.clonemon.domain.Monster;
import br.clonemon.domain.Trainer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Adapters JPA contra um Postgres real (Testcontainers), com o schema criado pelo Flyway. */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class PersistenceIntegrationTest {

    @Autowired TrainerRepository trainers;
    @Autowired MonsterRepository monsters;
    @Autowired BattleRepository battles;
    @Autowired SpeciesCatalog catalog;
    @Autowired JdbcTemplate jdbc;
    @Autowired TransactionTemplate tx;

    private Trainer newTrainer() {
        return trainers.save(new Trainer(null, "t" + UUID.randomUUID().toString().substring(0, 12), "{noop}x"));
    }

    @Test
    void seedMatchesOriginalClonemons() {
        assertThat(jdbc.queryForObject("select count(*) from species", Integer.class)).isEqualTo(6);
        assertThat(jdbc.queryForObject("select count(*) from move", Integer.class)).isEqualTo(12);
        assertThat(catalog.findAll()).isEqualTo(Catalog.ALL);
    }

    @Test
    void trainerRoundTripAndUniqueUsername() {
        Trainer t = newTrainer();
        assertThat(trainers.findByUsername(t.username())).contains(t);
        assertThat(trainers.existsByUsername(t.username())).isTrue();
        assertThatThrownBy(() -> trainers.save(new Trainer(null, t.username(), "{noop}y")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void monsterStateIsPersisted() {
        long trainerId = newTrainer().id();
        OwnedMonster saved = monsters.save(new OwnedMonster(null, trainerId, "Fogo", 0, new Monster(Catalog.LUCIFER, 12)));
        saved.monster().takeDamage(9);
        saved.monster().use(1);
        saved.monster().gainXp(100);
        monsters.save(saved);

        OwnedMonster loaded = monsters.findByTrainer(trainerId).getFirst();
        assertThat(loaded.id()).isEqualTo(saved.id());
        assertThat(loaded.nickname()).isEqualTo("Fogo");
        assertThat(loaded.teamSlot()).isZero();
        assertThat(loaded.monster().species()).isEqualTo(Catalog.LUCIFER);
        assertThat(loaded.monster().xp()).isEqualTo(saved.monster().xp());
        assertThat(loaded.monster().currentHp()).isEqualTo(saved.monster().currentHp());
        assertThat(loaded.monster().ppSnapshot()).containsExactly(25, 9);
    }

    @Test
    void teamSlotsMustBeUniquePerTrainer() {
        long trainerId = newTrainer().id();
        assertThatThrownBy(() -> tx.executeWithoutResult(s -> {
            monsters.save(new OwnedMonster(null, trainerId, "a", 0, new Monster(Catalog.GROOT, 5)));
            monsters.save(new OwnedMonster(null, trainerId, "b", 0, new Monster(Catalog.OLAF, 5)));
        })).rootCause().hasMessageContaining("monster_team_slot_uk");
    }

    @Test
    void swappingSlotsInOneTransactionIsAllowed() {
        long trainerId = newTrainer().id();
        OwnedMonster a = monsters.save(new OwnedMonster(null, trainerId, "a", 0, new Monster(Catalog.GROOT, 5)));
        OwnedMonster b = monsters.save(new OwnedMonster(null, trainerId, "b", 1, new Monster(Catalog.OLAF, 5)));

        tx.executeWithoutResult(s -> monsters.saveAll(List.of(a.withTeamSlot(1), b.withTeamSlot(0))));

        assertThat(monsters.findByTrainer(trainerId)).extracting(OwnedMonster::teamSlot).containsExactly(1, 0);
    }

    @Test
    void battleStateRoundTripsThroughJsonb() {
        long trainerId = newTrainer().id();
        OwnedMonster hero = monsters.save(new OwnedMonster(null, trainerId, "h", 0, new Monster(Catalog.GROOT, 10)));
        Monster enemy = new Monster(Catalog.COISO, 9);
        enemy.takeDamage(4);
        Battle.State state = new Battle.State(List.of(hero.monster()), List.of(enemy), 0, 0,
                Battle.Status.AWAITING_ACTION, List.of("Groot usou Cartolinada!", "E super efetivo!"));

        StoredBattle saved = battles.save(new StoredBattle(null, trainerId, List.of(hero.id()), state));
        StoredBattle loaded = battles.findById(saved.id()).orElseThrow();

        assertThat(loaded.trainerId()).isEqualTo(trainerId);
        assertThat(loaded.playerMonsterIds()).containsExactly(hero.id());
        assertThat(loaded.state().status()).isEqualTo(Battle.Status.AWAITING_ACTION);
        assertThat(loaded.state().log()).isEqualTo(state.log());
        Monster loadedEnemy = loaded.state().enemyTeam().getFirst();
        assertThat(loadedEnemy.species()).isEqualTo(Catalog.COISO);
        assertThat(loadedEnemy.currentHp()).isEqualTo(enemy.currentHp());
        assertThat(loadedEnemy.xp()).isEqualTo(enemy.xp());
        assertThat(battles.findActiveByTrainer(trainerId)).map(StoredBattle::id).contains(saved.id());
    }

    @Test
    void finishedBattleIsNoLongerActiveAndOnlyOneActiveAllowed() {
        long trainerId = newTrainer().id();
        OwnedMonster hero = monsters.save(new OwnedMonster(null, trainerId, "h", 0, new Monster(Catalog.GROOT, 10)));
        Battle.State active = new Battle.State(List.of(hero.monster()), List.of(new Monster(Catalog.OLAF, 5)), 0, 0,
                Battle.Status.AWAITING_ACTION, List.of());
        StoredBattle saved = battles.save(new StoredBattle(null, trainerId, List.of(hero.id()), active));

        assertThatThrownBy(() -> battles.save(new StoredBattle(null, trainerId, List.of(hero.id()), active)))
                .isInstanceOf(DataIntegrityViolationException.class);

        Battle.State fled = new Battle.State(active.playerTeam(), active.enemyTeam(), 0, 0, Battle.Status.FLED, List.of("Voce fugiu!"));
        battles.save(new StoredBattle(saved.id(), trainerId, List.of(hero.id()), fled));
        assertThat(battles.findActiveByTrainer(trainerId)).isEmpty();
    }
}
