package br.clonemon.application;

import br.clonemon.application.port.ReplayRepository.Growth;
import br.clonemon.application.port.ReplayRepository.Replay;
import br.clonemon.domain.AiStrategy;
import br.clonemon.domain.Battle;
import br.clonemon.domain.Catalog;
import br.clonemon.domain.DamageCalculator;
import br.clonemon.domain.ExperienceCurve;
import org.junit.jupiter.api.Test;

import java.util.random.RandomGenerator;

import static org.assertj.core.api.Assertions.assertThat;

/** O que o BattleService grava para o replay: retrato inicial, cada turno, o resultado e a limpeza. */
class ReplayRecordingTest {

    private static final long TRAINER = 1L;
    private static final long OTHER = 2L;

    /** Sempre acerta, nunca e critico, rolagem de dano maxima, empate de velocidade para o oponente. */
    private static final RandomGenerator STEADY = new RandomGenerator() {
        @Override public long nextLong() { return 50; }
        @Override public int nextInt(int bound) { return Math.min(50, bound - 1); }
    };

    private final InMemoryPorts.Monsters monsters = new InMemoryPorts.Monsters();
    private final InMemoryPorts.Replays replays = new InMemoryPorts.Replays();

    /** Encontro: nextInt(4)=0 => nivel do time - 2; nextInt(12)=1 => Coiso. */
    private BattleService service() {
        return new BattleService(new InMemoryPorts.Battles(), monsters, new InMemoryPorts.FixtureCatalog(),
                new InMemoryPorts.Npcs(), new InMemoryPorts.World(), replays,
                new DamageCalculator(STEADY), AiStrategy.greedy(), new InMemoryPorts.ScriptedRandom(0, 1));
    }

    private static BattleSession playMove(BattleService service, BattleSession s, int move) {
        BattleSession current = s;
        for (int i = 0; i < 30 && !current.battle().isFinished(); i++)
            current = service.submitTurn(TRAINER, current.id(), new Battle.UseMove(move)).session();
        return current;
    }

    @Test
    void startStoresTheTeamsAsTheyBegan() {
        monsters.add(TRAINER, Catalog.LINDOYA, 20, 0);
        BattleSession s = service().start(TRAINER);

        InMemoryPorts.Replays.Entry e = replays.entries.get(s.id());
        assertThat(e.opponent).isEqualTo("Coiso selvagem");
        assertThat(e.snapshot.lead()).isEqualTo("Lindoya");
        assertThat(e.snapshot.enemyTeam()).singleElement()
                .satisfies(c -> assertThat(c.name()).isEqualTo("Coiso"))
                .satisfies(c -> assertThat(c.level()).isEqualTo(18));
        assertThat(e.snapshot.npcName()).isNull();
        assertThat(replays.listFinished(TRAINER, 20)).as("ainda em andamento").isEmpty();
    }

    @Test
    void everyTurnIsRecordedAndTheEndFinishesTheReplay() {
        monsters.add(TRAINER, Catalog.LINDOYA, 20, 0);
        BattleService service = service();
        BattleSession end = playMove(service, service.start(TRAINER), 1);

        Replay r = replays.findFinished(TRAINER, end.id()).orElseThrow();
        assertThat(r.summary().result()).isEqualTo(Battle.Status.PLAYER_WON);
        assertThat(r.turns()).isNotEmpty().allSatisfy(t -> assertThat(t.playerTeam()).hasSize(1));
        assertThat(r.turns().getLast().events().getLast().text()).endsWith("entrou para o seu time!");
        assertThat(r.summary().turnCount()).isEqualTo(r.turns().size());
    }

    @Test
    void theTurnKeepsTheLevelGainedInIt() {
        OwnedMonster hero = monsters.add(TRAINER, Catalog.LINDOYA, 20, 0);
        hero.monster().gainXp(ExperienceCurve.xpForLevel(21) - 1 - hero.monster().xp());
        monsters.save(hero);
        BattleService service = service();
        BattleSession end = playMove(service, service.start(TRAINER), 1);

        Replay r = replays.findFinished(TRAINER, end.id()).orElseThrow();
        assertThat(r.snapshot().playerTeam().getFirst().level()).isEqualTo(20);
        Growth after = r.turns().getLast().playerTeam().getFirst();
        assertThat(after.level()).isEqualTo(21);
        assertThat(after.maxHp()).isEqualTo(end.battle().playerTeam().getFirst().maxHp());
    }

    @Test
    void trainerBattlesAreNamedAfterTheTrainer() {
        monsters.add(TRAINER, Catalog.LINDOYA, 20, 0);
        BattleSession s = service().challenge(TRAINER, "caio");

        InMemoryPorts.Replays.Entry e = replays.entries.get(s.id());
        assertThat(e.opponent).isEqualTo("CAIO");
        assertThat(e.snapshot.npcName()).isEqualTo("CAIO");
        assertThat(e.snapshot.enemyTeam()).extracting(c -> c.name()).containsExactly("Boto", "Pimentinha");
    }

    @Test
    void fleeingFinishesTheReplayInOneTurn() {
        monsters.add(TRAINER, Catalog.LINDOYA, 20, 0);
        BattleService service = service();
        BattleSession s = service.start(TRAINER);
        service.submitTurn(TRAINER, s.id(), new Battle.Run());

        Replay r = replays.findFinished(TRAINER, s.id()).orElseThrow();
        assertThat(r.summary().result()).isEqualTo(Battle.Status.FLED);
        assertThat(r.turns()).hasSize(1);
    }

    @Test
    void onlyTheNewest20FinishedReplaysAreKept() {
        monsters.add(TRAINER, Catalog.LINDOYA, 20, 0);
        BattleService service = service();
        long last = 0;
        for (int i = 0; i < 22; i++) {
            BattleSession s = service.start(TRAINER);
            service.submitTurn(TRAINER, s.id(), new Battle.Run());
            last = s.id();
        }
        assertThat(replays.listFinished(TRAINER, 100)).hasSize(BattleService.REPLAYS_KEPT)
                .first().extracting(r -> r.id()).isEqualTo(last);
    }

    @Test
    void otherTrainersCannotSeeAReplay() {
        monsters.add(TRAINER, Catalog.LINDOYA, 20, 0);
        BattleService service = service();
        BattleSession s = service.start(TRAINER);
        service.submitTurn(TRAINER, s.id(), new Battle.Run());

        assertThat(replays.findFinished(OTHER, s.id())).isEmpty();
    }
}
