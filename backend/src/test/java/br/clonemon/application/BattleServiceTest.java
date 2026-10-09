package br.clonemon.application;

import br.clonemon.domain.AiStrategy;
import br.clonemon.domain.Battle;
import br.clonemon.domain.Catalog;
import br.clonemon.domain.DamageCalculator;
import br.clonemon.domain.Monster;
import org.junit.jupiter.api.Test;

import java.util.random.RandomGenerator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BattleServiceTest {
    private static final long TRAINER = 1L;
    private static final long OTHER = 2L;

    /** Sempre acerta e nunca e critico. */
    private static final RandomGenerator STEADY = new RandomGenerator() {
        @Override public long nextLong() { return 50; }
        @Override public int nextInt(int bound) { return Math.min(50, bound - 1); }
    };

    private final InMemoryPorts.Monsters monsters = new InMemoryPorts.Monsters();
    private final InMemoryPorts.Battles battles = new InMemoryPorts.Battles();

    /** Encontro: nextInt(4)=0 => nivel do time - 2; nextInt(6)=1 => Coiso (ROCHA, fraco contra AGUA). */
    private BattleService serviceMeetingCoiso() {
        return new BattleService(battles, monsters, new InMemoryPorts.FixtureCatalog(),
                new DamageCalculator(STEADY), AiStrategy.greedy(), new InMemoryPorts.ScriptedRandom(0, 1));
    }

    @Test
    void cannotStartWithoutTeam() {
        assertThatThrownBy(() -> serviceMeetingCoiso().start(TRAINER)).isInstanceOf(ConflictException.class);
    }

    @Test
    void cannotStartWithAllMonstersFainted() {
        OwnedMonster m = monsters.add(TRAINER, Catalog.GROOT, 5, 0);
        m.monster().takeDamage(999);
        monsters.save(m);
        assertThatThrownBy(() -> serviceMeetingCoiso().start(TRAINER)).isInstanceOf(ConflictException.class);
    }

    @Test
    void onlyOneActiveBattlePerTrainer() {
        monsters.add(TRAINER, Catalog.GROOT, 5, 0);
        BattleService service = serviceMeetingCoiso();
        service.start(TRAINER);
        assertThatThrownBy(() -> service.start(TRAINER)).isInstanceOf(ConflictException.class);
    }

    @Test
    void wildMonsterLevelFollowsTeam() {
        monsters.add(TRAINER, Catalog.GROOT, 20, 0);
        BattleSession s = serviceMeetingCoiso().start(TRAINER);
        assertThat(s.battle().enemyMonster().species()).isEqualTo(Catalog.COISO);
        assertThat(s.battle().enemyMonster().level()).isEqualTo(18);
    }

    @Test
    void boxedMonstersDoNotJoinBattle() {
        OwnedMonster lead = monsters.add(TRAINER, Catalog.GROOT, 10, 0);
        monsters.add(TRAINER, Catalog.OLAF, 10, null);
        BattleSession s = serviceMeetingCoiso().start(TRAINER);
        assertThat(s.playerMonsterIds()).containsExactly(lead.id());
    }

    @Test
    void turnSavesPlayerProgress() {
        OwnedMonster hero = monsters.add(TRAINER, Catalog.GROOT, 10, 0);
        BattleService service = serviceMeetingCoiso();
        BattleSession s = service.start(TRAINER);

        BattleService.TurnResult r = service.submitTurn(TRAINER, s.id(), new Battle.UseMove(1));

        Monster saved = monsters.findByTrainer(TRAINER).getFirst().monster();
        Monster inBattle = r.session().battle().playerMonster();
        assertThat(saved.ppLeft(1)).isEqualTo(9);
        assertThat(saved.currentHp()).isEqualTo(inBattle.currentHp());
        assertThat(saved.xp()).isEqualTo(inBattle.xp());
        assertThat(service.get(TRAINER, s.id()).battle().log()).isEqualTo(r.session().battle().log());
        assertThat(hero.id()).isEqualTo(s.playerMonsterIds().getFirst());
    }

    @Test
    void winningGrantsXpAndRecruitsDefeatedMonster() {
        OwnedMonster hero = monsters.add(TRAINER, Catalog.LINDOYA, 50, 0);
        int xpBefore = hero.monster().xp();
        BattleService service = serviceMeetingCoiso();
        BattleSession s = service.start(TRAINER);

        BattleService.TurnResult last = null;
        for (int i = 0; i < 10 && (last == null || !last.session().battle().isFinished()); i++)
            last = service.submitTurn(TRAINER, s.id(), new Battle.UseMove(1));

        assertThat(last.session().battle().status()).isEqualTo(Battle.Status.PLAYER_WON);
        assertThat(last.events()).last().extracting(Battle.Event::text).isEqualTo("Coiso entrou para o seu time!");
        var roster = new TeamService(monsters, battles, new InMemoryPorts.FixtureCatalog()).roster(TRAINER);
        assertThat(roster.team()).hasSize(2);
        assertThat(roster.team().get(1).monster().species()).isEqualTo(Catalog.COISO);
        assertThat(roster.team().get(1).monster().level()).isEqualTo(48);
        assertThat(roster.team().getFirst().monster().xp()).isGreaterThanOrEqualTo(xpBefore);
        assertThat(service.active(TRAINER)).isEmpty();
    }

    @Test
    void recruitGoesToBoxWhenTeamIsFull() {
        monsters.add(TRAINER, Catalog.LINDOYA, 50, 0);
        for (int slot = 1; slot < 6; slot++) monsters.add(TRAINER, Catalog.GROOT, 5, slot);
        BattleService service = serviceMeetingCoiso();
        BattleSession s = service.start(TRAINER);

        BattleService.TurnResult last = null;
        for (int i = 0; i < 10 && (last == null || !last.session().battle().isFinished()); i++)
            last = service.submitTurn(TRAINER, s.id(), new Battle.UseMove(1));

        assertThat(last.events()).last().extracting(Battle.Event::text).isEqualTo("Coiso foi enviado para o PC.");
        assertThat(monsters.findByTrainer(TRAINER)).hasSize(7).last().extracting(OwnedMonster::teamSlot).isNull();
    }

    @Test
    void runningFreesTrainerForNewBattle() {
        monsters.add(TRAINER, Catalog.GROOT, 5, 0);
        BattleService service = serviceMeetingCoiso();
        BattleSession s = service.start(TRAINER);

        service.submitTurn(TRAINER, s.id(), new Battle.Run());

        assertThat(service.get(TRAINER, s.id()).battle().status()).isEqualTo(Battle.Status.FLED);
        assertThatThrownBy(() -> service.submitTurn(TRAINER, s.id(), new Battle.UseMove(0)))
                .isInstanceOf(ConflictException.class);
        assertThat(service.start(TRAINER).id()).isNotEqualTo(s.id());
    }

    @Test
    void otherTrainersBattleIsNotFound() {
        monsters.add(TRAINER, Catalog.GROOT, 5, 0);
        BattleService service = serviceMeetingCoiso();
        BattleSession s = service.start(TRAINER);

        assertThatThrownBy(() -> service.get(OTHER, s.id())).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> service.submitTurn(OTHER, s.id(), new Battle.Run())).isInstanceOf(NotFoundException.class);
    }
}
