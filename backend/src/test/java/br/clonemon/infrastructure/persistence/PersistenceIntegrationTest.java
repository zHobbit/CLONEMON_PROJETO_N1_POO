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
import br.clonemon.domain.ExperienceCurve;
import br.clonemon.domain.Monster;
import br.clonemon.domain.Stat;
import br.clonemon.domain.StatusCondition;
import br.clonemon.domain.Trainer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.Map;
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
        assertThat(jdbc.queryForObject("select count(*) from move", Integer.class)).isEqualTo(24);
        assertThat(catalog.findAll()).isEqualTo(Catalog.ALL);
    }

    @Test
    void movesInsertedWithoutTheNewColumnsGetDefaults() {
        tx.executeWithoutResult(s -> {
            jdbc.update("insert into move (id, name, element, power, accuracy, max_pp) values (999, 'Teste V3', 'AGUA', 10, 100, 5)");
            assertThat(jdbc.queryForMap("select effect, effect_chance, effect_stat, effect_stages from move where id = 999"))
                    .containsEntry("effect", "NONE").containsEntry("effect_chance", 0)
                    .containsEntry("effect_stat", null).containsEntry("effect_stages", 0);
            jdbc.update("insert into species_move (species_id, slot, move_id) values (1, 9, 999)");
            assertThat(jdbc.queryForObject("select learn_level from species_move where species_id = 1 and slot = 9", Integer.class))
                    .isEqualTo(1);
            s.setRollbackOnly();
        });
        assertThatThrownBy(() -> jdbc.update("insert into move (id, name, element, power, accuracy, max_pp, effect, effect_chance) "
                + "values (998, 'Sem chance', 'AGUA', 0, 100, 5, 'BURN', 0)")).isInstanceOf(DataIntegrityViolationException.class);
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
        assertThat(loaded.monster().ppSnapshot()).containsExactly(25, 9, 15, 15);
    }

    @Test
    void learnedMoveAddsPpRow() {
        long trainerId = newTrainer().id();
        OwnedMonster saved = monsters.save(new OwnedMonster(null, trainerId, "Gelo", 0, new Monster(Catalog.OLAF, 6)));
        assertThat(saved.monster().ppSnapshot()).hasSize(2);
        saved.monster().gainXp(ExperienceCurve.xpForLevel(7) - saved.monster().xp());
        monsters.save(saved);

        assertThat(monsters.findByTrainer(trainerId).getFirst().monster().ppSnapshot()).containsExactly(25, 10, 15);
        assertThat(jdbc.queryForObject("select count(*) from monster_move_pp where monster_id = ?", Integer.class, saved.id()))
                .isEqualTo(3);
    }

    @Test
    void monsterSavedBeforeLearnedMovesExistedGetsTheirPp() {
        long trainerId = newTrainer().id();
        OwnedMonster saved = monsters.save(new OwnedMonster(null, trainerId, "Velho", 0, new Monster(Catalog.GROOT, 12)));
        // Como estava no banco antes da V3: so as linhas de PP dos 2 golpes originais.
        jdbc.update("delete from monster_move_pp where monster_id = ? and slot >= 2", saved.id());

        assertThat(monsters.findByTrainer(trainerId).getFirst().monster().ppSnapshot()).containsExactly(25, 10, 15, 10);
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
    void battleConditionsRoundTripThroughJsonb() {
        long trainerId = newTrainer().id();
        OwnedMonster hero = monsters.save(new OwnedMonster(null, trainerId, "h", 0, new Monster(Catalog.COISO, 10)));
        hero.monster().inflict(StatusCondition.BURN, 0);
        hero.monster().changeStage(Stat.DEF, 4);
        Monster enemy = new Monster(Catalog.LUCIFER, 9);
        enemy.inflict(StatusCondition.SLEEP, 3);
        enemy.changeStage(Stat.SPD, -2);
        enemy.changeStage(Stat.ATK, 1);
        Battle.State state = new Battle.State(List.of(hero.monster()), List.of(enemy), 0, 0, Battle.Status.AWAITING_ACTION, List.of());

        StoredBattle loaded = battles.findById(battles.save(new StoredBattle(null, trainerId, List.of(hero.id()), state)).id())
                .orElseThrow();

        Monster loadedHero = loaded.state().playerTeam().getFirst();
        assertThat(loadedHero.status()).isEqualTo(StatusCondition.BURN);
        assertThat(loadedHero.stages()).containsOnly(Map.entry(Stat.DEF, 4));
        Monster loadedEnemy = loaded.state().enemyTeam().getFirst();
        assertThat(loadedEnemy.status()).isEqualTo(StatusCondition.SLEEP);
        assertThat(loadedEnemy.sleepTurns()).isEqualTo(3);
        assertThat(loadedEnemy.stages()).containsOnly(Map.entry(Stat.SPD, -2), Map.entry(Stat.ATK, 1));
    }

    @Test
    void battleSavedBeforeStatusesStillLoads() {
        long trainerId = newTrainer().id();
        OwnedMonster hero = monsters.save(new OwnedMonster(null, trainerId, "h", 0, new Monster(Catalog.GROOT, 12)));
        // Formato do jsonb antes da V3: sem status, sono e estagios, e PP so dos 2 golpes originais.
        String oldState = """
                {"playerMonsterIds":[%d],
                 "player":[{"speciesId":5,"xp":1728,"hp":30,"pp":[20,8]}],
                 "enemy":[{"speciesId":2,"xp":1000,"hp":25,"pp":[25,10]}],
                 "playerActive":0,"enemyActive":0,"log":["Groot usou Cartolinada!"]}
                """.formatted(hero.id());
        Long id = jdbc.queryForObject("insert into battle (trainer_id, status, state) values (?, 'AWAITING_ACTION', ?::jsonb) returning id",
                Long.class, trainerId, oldState);

        StoredBattle loaded = battles.findById(id).orElseThrow();

        Monster player = loaded.state().playerTeam().getFirst();
        assertThat(player.status()).isEqualTo(StatusCondition.NONE);
        assertThat(player.stages()).isEmpty();
        assertThat(player.ppSnapshot()).containsExactly(20, 8, 15, 10);
        Monster enemy = loaded.state().enemyTeam().getFirst();
        assertThat(enemy.level()).isEqualTo(10);
        assertThat(enemy.ppSnapshot()).containsExactly(25, 10, 20);
        assertThat(loaded.state().log()).containsExactly("Groot usou Cartolinada!");
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
