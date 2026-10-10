package br.clonemon.application;

import br.clonemon.domain.AiStrategy;
import br.clonemon.domain.Battle;
import br.clonemon.domain.Catalog;
import br.clonemon.domain.DamageCalculator;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.random.RandomGenerator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

/** Desafios contra os treinadores do mapa. */
class TrainerBattleServiceTest {
    private static final long TRAINER = 1L;

    /** Sempre acerta e nunca e critico. */
    private static final RandomGenerator STEADY = new RandomGenerator() {
        @Override public long nextLong() { return 50; }
        @Override public int nextInt(int bound) { return Math.min(50, bound - 1); }
    };

    /** A IA de selvagem nunca deve ser usada contra um treinador. */
    private static final AiStrategy WILD_ONLY = (self, target) -> {
        throw new AssertionError("Wild AI used in a trainer battle");
    };

    private final InMemoryPorts.Monsters monsters = new InMemoryPorts.Monsters();
    private final InMemoryPorts.Battles battles = new InMemoryPorts.Battles();
    private final InMemoryPorts.World world = new InMemoryPorts.World();
    private final BattleService service = new BattleService(battles, monsters, new InMemoryPorts.FixtureCatalog(),
            new InMemoryPorts.Npcs(), world, new DamageCalculator(STEADY), WILD_ONLY, new InMemoryPorts.ScriptedRandom());

    /** Joga o mesmo golpe ate a batalha acabar; devolve os eventos de todos os turnos. */
    private List<Battle.Event> playUntilFinished(long battleId, int moveIndex) {
        List<Battle.Event> events = new ArrayList<>();
        for (int i = 0; i < 30 && !service.get(TRAINER, battleId).battle().isFinished(); i++)
            events.addAll(service.submitTurn(TRAINER, battleId, new Battle.UseMove(moveIndex)).events());
        return events;
    }

    @Test
    void unknownNpcIsNotFound() {
        monsters.add(TRAINER, Catalog.GROOT, 5, 0);
        assertThatThrownBy(() -> service.challenge(TRAINER, "nobody")).isInstanceOf(NotFoundException.class);
    }

    @Test
    void challengeFacesTheNpcFixedTeam() {
        monsters.add(TRAINER, Catalog.GROOT, 5, 0);

        BattleSession s = service.challenge(TRAINER, "caio");

        assertThat(s.npcId()).isEqualTo("caio");
        assertThat(s.battle().opponentName()).isEqualTo("CAIO");
        assertThat(s.battle().enemyTeam()).extracting(m -> m.species().name(), m -> m.level())
                .containsExactly(tuple("Coiso", 5), tuple("Abacaxi", 6));
        BattleSession restored = service.get(TRAINER, s.id());
        assertThat(restored.npcId()).isEqualTo("caio");
        assertThat(restored.battle().opponentName()).isEqualTo("CAIO");
    }

    @Test
    void trainerUsesTheGreedyAiAlsoAfterRestore() {
        monsters.add(TRAINER, Catalog.GROOT, 3, 0);
        BattleSession s = service.challenge(TRAINER, "caio");

        // Coiso no nivel 5 conhece Pedrada (40) e Meteoro (90, 85%): o guloso escolhe Meteoro.
        List<Battle.Event> events = service.submitTurn(TRAINER, s.id(), new Battle.UseMove(0)).events();

        assertThat(events).extracting(Battle.Event::text).contains("Coiso usou Meteoro!");
    }

    @Test
    void cannotRunFromTrainer() {
        monsters.add(TRAINER, Catalog.GROOT, 5, 0);
        BattleSession s = service.challenge(TRAINER, "caio");

        assertThatThrownBy(() -> service.submitTurn(TRAINER, s.id(), new Battle.Run()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Nao da para fugir de batalha contra treinador");
        assertThat(service.active(TRAINER)).map(BattleSession::id).contains(s.id());
    }

    @Test
    void winningRecordsTheDefeatWithoutRecruiting() {
        OwnedMonster hero = monsters.add(TRAINER, Catalog.LINDOYA, 40, 0);
        int xpBefore = hero.monster().xp();
        BattleSession s = service.challenge(TRAINER, "caio");

        List<Battle.Event> events = playUntilFinished(s.id(), 1);

        assertThat(service.get(TRAINER, s.id()).battle().status()).isEqualTo(Battle.Status.PLAYER_WON);
        assertThat(events).extracting(Battle.Event::text).contains("CAIO enviou Abacaxi!", "Voce venceu!");
        assertThat(events).last().extracting(Battle.Event::text).isEqualTo("Voce derrotou CAIO!");
        assertThat(monsters.findByTrainer(TRAINER)).hasSize(1);
        assertThat(monsters.findByTrainer(TRAINER).getFirst().monster().xp()).isGreaterThan(xpBefore);
        assertThat(world.findDefeatedNpcs(TRAINER)).containsExactly("caio");
        assertThatThrownBy(() -> service.challenge(TRAINER, "caio")).isInstanceOf(ConflictException.class);
    }

    @Test
    void losingRecordsNothingAndFaintedTeamCannotChallenge() {
        monsters.add(TRAINER, Catalog.GROOT, 2, 0);
        BattleSession s = service.challenge(TRAINER, "zeca");

        List<Battle.Event> events = playUntilFinished(s.id(), 0);

        assertThat(service.get(TRAINER, s.id()).battle().status()).isEqualTo(Battle.Status.PLAYER_LOST);
        assertThat(events).extracting(Battle.Event::text).noneMatch(t -> t.startsWith("Voce derrotou"));
        assertThat(world.findDefeatedNpcs(TRAINER)).isEmpty();
        assertThatThrownBy(() -> service.challenge(TRAINER, "zeca")).isInstanceOf(ConflictException.class);
    }

    @Test
    void alreadyDefeatedNpcIsConflict() {
        monsters.add(TRAINER, Catalog.GROOT, 5, 0);
        world.recordDefeat(TRAINER, "bia");

        assertThatThrownBy(() -> service.challenge(TRAINER, "bia")).isInstanceOf(ConflictException.class);
        assertThat(service.challenge(TRAINER, "caio").npcId()).isEqualTo("caio");
    }

    @Test
    void cannotChallengeDuringAnotherBattle() {
        monsters.add(TRAINER, Catalog.GROOT, 5, 0);
        BattleSession wild = new BattleService(battles, monsters, new InMemoryPorts.FixtureCatalog(), new InMemoryPorts.Npcs(),
                world, new DamageCalculator(STEADY), AiStrategy.greedy(), new InMemoryPorts.ScriptedRandom()).start(TRAINER);

        assertThat(wild.npcId()).isNull();
        assertThat(wild.battle().opponentName()).isNull();
        assertThatThrownBy(() -> service.challenge(TRAINER, "caio")).isInstanceOf(ConflictException.class);
    }

    @Test
    void cannotChallengeWithoutTeam() {
        assertThatThrownBy(() -> service.challenge(TRAINER, "caio")).isInstanceOf(ConflictException.class);
    }
}
