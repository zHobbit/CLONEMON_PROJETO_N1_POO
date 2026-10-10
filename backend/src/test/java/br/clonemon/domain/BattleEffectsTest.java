package br.clonemon.domain;

import br.clonemon.domain.Battle.Effect;
import br.clonemon.domain.Battle.Event;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.List;
import java.util.random.RandomGenerator;

import static org.assertj.core.api.Assertions.assertThat;

/** Golpes aprendidos por nivel, status e estagios dentro da batalha. */
class BattleEffectsTest {

    /** Todo sorteio devolve {@code value} (limitado ao intervalo pedido). */
    private static DamageCalculator dice(int value) {
        return new DamageCalculator(new RandomGenerator() {
            @Override public long nextLong() { return value; }
            @Override public int nextInt(int bound) { return Math.min(value, bound - 1); }
        });
    }

    /** 50: acerta, sem critico, efeitos de 30% falham, paralisia nao trava, congelado nao descongela. */
    private static final DamageCalculator STEADY = dice(50);
    /** 10: acerta, sem critico, efeitos de 30% funcionam, paralisia trava, congelado descongela. */
    private static final DamageCalculator LUCKY = dice(10);

    private static Battle battle(Monster player, Monster enemy, DamageCalculator calc) {
        return new Battle(List.of(player), List.of(enemy), calc, AiStrategy.greedy());
    }

    private static Event find(List<Event> events, String text) {
        return events.stream().filter(e -> e.text().equals(text)).findFirst()
                .orElseThrow(() -> new AssertionError("Sem o evento '" + text + "' em " + events));
    }

    private static List<String> texts(List<Event> events) {
        return events.stream().map(Event::text).toList();
    }

    // --- Golpes aprendidos ---

    @Test
    void levelingUpInBattleLearnsTheMove() {
        Monster hero = new Monster(Catalog.LUCIFER, 6);
        Monster enemy = new Monster(Catalog.OLAF, 7); // derrotar um nivel 7 da 140 XP: nivel 6 -> 7
        enemy.takeDamage(enemy.maxHp() - 1);
        Battle b = battle(hero, enemy, STEADY);

        List<Event> events = b.submit(new Battle.UseMove(0));

        assertThat(texts(events)).containsSubsequence(
                "Lucifer ganhou 140 XP!", "Lucifer subiu para o nivel 7!", "Lucifer aprendeu Churrasco grego!", "Voce venceu!");
        assertThat(find(events, "Lucifer aprendeu Churrasco grego!").effect()).isEqualTo(Effect.MOVE_LEARNED);
        assertThat(hero.moves()).hasSize(3);
        assertThat(hero.ppLeft(2)).isEqualTo(15);
    }

    @Test
    void noMoveLearnedWithoutReachingItsLevel() {
        Monster hero = new Monster(Catalog.LUCIFER, 7);
        Monster enemy = new Monster(Catalog.OLAF, 2);
        enemy.takeDamage(enemy.maxHp() - 1);
        List<Event> events = battle(hero, enemy, STEADY).submit(new Battle.UseMove(0));
        assertThat(events).extracting(Event::effect).doesNotContain(Effect.MOVE_LEARNED);
        assertThat(hero.moves()).hasSize(3);
    }

    // --- Status ---

    @Test
    void burnIsAppliedAndHurtsAtEndOfTurn() {
        Monster hero = new Monster(Catalog.LUCIFER, 20);
        Monster enemy = new Monster(Catalog.COISO, 20);
        Battle b = battle(hero, enemy, LUCKY);

        List<Event> events = b.submit(new Battle.UseMove(2)); // Churrasco grego, 30%

        Event burned = find(events, "Coiso pegou fogo!");
        assertThat(burned.effect()).isEqualTo(Effect.ENEMY_STATUS);
        assertThat(burned.enemyStatus()).isEqualTo(StatusCondition.BURN);
        assertThat(burned.playerStatus()).isEqualTo(StatusCondition.NONE);
        int burnIndex = texts(events).indexOf("Coiso sofreu com a queimadura!");
        Event burn = events.get(burnIndex);
        assertThat(burn.effect()).isEqualTo(Effect.ENEMY_STATUS_DAMAGE);
        assertThat(events.get(burnIndex - 1).enemyHp() - burn.enemyHp()).isEqualTo(enemy.maxHp() / 16);
        assertThat(burnIndex).as("a queimadura vem no fim do turno").isEqualTo(events.size() - 1);
    }

    @Test
    void burnCanKnockOutAndStillGivesXp() {
        Monster hero = new Monster(Catalog.COISO, 12);
        Monster enemy = new Monster(Catalog.GROOT, 5);
        enemy.inflict(StatusCondition.BURN, 0);
        enemy.takeDamage(enemy.maxHp() - 1);
        Battle b = battle(hero, enemy, STEADY);

        List<Event> events = b.submit(new Battle.UseMove(2)); // Casca grossa: nao causa dano

        assertThat(texts(events)).containsSubsequence(
                "Groot sofreu com a queimadura!", "Groot desmaiou!", "Coiso ganhou 100 XP!", "Voce venceu!");
        assertThat(find(events, "Groot desmaiou!").effect()).isEqualTo(Effect.ENEMY_FAINT);
        assertThat(b.status()).isEqualTo(Battle.Status.PLAYER_WON);
    }

    @Test
    void damagingMoveSecondaryEffectFailsSilentlyOnImmuneTarget() {
        Monster hero = new Monster(Catalog.LUCIFER, 20);
        Monster enemy = new Monster(Catalog.LUCIFER, 20);
        List<Event> events = battle(hero, enemy, LUCKY).submit(new Battle.UseMove(2));
        assertThat(enemy.status()).isEqualTo(StatusCondition.NONE);
        assertThat(texts(events)).doesNotContain("Mas nao funcionou!", "Lucifer pegou fogo!");
    }

    @Test
    void freezeIsAppliedAndThawsWithLuck() {
        Monster hero = new Monster(Catalog.OLAF, 20);
        Monster enemy = new Monster(Catalog.LINDOYA, 20);
        List<Event> events = battle(hero, enemy, LUCKY).submit(new Battle.UseMove(3)); // Picole de chuchu, 15%

        assertThat(texts(events)).containsSubsequence("Olaf usou Picole de chuchu!", "Lindoya congelou!", "Lindoya descongelou!",
                "Lindoya usou Vap de alta pressao!");
        assertThat(find(events, "Lindoya congelou!").enemyStatus()).isEqualTo(StatusCondition.FREEZE);
        assertThat(find(events, "Lindoya descongelou!").effect()).isEqualTo(Effect.ENEMY_CURE);
        assertThat(enemy.status()).isEqualTo(StatusCondition.NONE);
    }

    @Test
    void frozenMonsterCannotAct() {
        Monster hero = new Monster(Catalog.COISO, 20);
        Monster enemy = new Monster(Catalog.LINDOYA, 20);
        enemy.inflict(StatusCondition.FREEZE, 0);
        Battle b = battle(hero, enemy, STEADY);

        for (int turn = 0; turn < 3; turn++) {
            List<Event> events = b.submit(new Battle.UseMove(2)); // Casca grossa
            assertThat(texts(events)).contains("Lindoya esta congelado!").noneMatch(t -> t.startsWith("Lindoya usou"));
        }
        assertThat(hero.currentHp()).isEqualTo(hero.maxHp());
        assertThat(enemy.status()).isEqualTo(StatusCondition.FREEZE);
    }

    @ParameterizedTest
    @CsvSource({"19, true", "20, false"})
    void frozenMonsterThawsWithTwentyPercentChance(int roll, boolean thaws) {
        Monster hero = new Monster(Catalog.COISO, 20);
        Monster enemy = new Monster(Catalog.LINDOYA, 20);
        enemy.inflict(StatusCondition.FREEZE, 0);
        List<Event> events = battle(hero, enemy, dice(roll)).submit(new Battle.UseMove(2));
        assertThat(texts(events).contains("Lindoya descongelou!")).isEqualTo(thaws);
        assertThat(texts(events).contains("Lindoya esta congelado!")).isEqualTo(!thaws);
    }

    @Test
    void paralysisIsAppliedAndCanSkipTheTurn() {
        Monster hero = new Monster(Catalog.ELETROPAULO, 12);
        Monster enemy = new Monster(Catalog.LINDOYA, 20);
        List<Event> events = battle(hero, enemy, LUCKY).submit(new Battle.UseMove(3)); // Dedo na tomada, 30%

        assertThat(texts(events)).containsSubsequence("Lindoya ficou paralisado!", "Lindoya esta paralisado! Nao conseguiu se mover!");
        assertThat(find(events, "Lindoya ficou paralisado!").effect()).isEqualTo(Effect.ENEMY_STATUS);
        assertThat(hero.currentHp()).isEqualTo(hero.maxHp());
    }

    @Test
    void paralyzedMonsterUsuallyActs() {
        Monster hero = new Monster(Catalog.COISO, 20);
        Monster enemy = new Monster(Catalog.LINDOYA, 20);
        enemy.inflict(StatusCondition.PARALYSIS, 0);
        List<Event> events = battle(hero, enemy, STEADY).submit(new Battle.UseMove(0));
        assertThat(texts(events)).anyMatch(t -> t.startsWith("Lindoya usou"));
        assertThat(enemy.status()).as("paralisia nao passa sozinha").isEqualTo(StatusCondition.PARALYSIS);
    }

    @Test
    void paralysisHalvesSpeedAndChangesTurnOrder() {
        Monster hero = new Monster(Catalog.LUCIFER, 20); // velocidade 31 contra 25
        Monster enemy = new Monster(Catalog.OLAF, 20);
        assertThat(battle(hero, enemy, STEADY).submit(new Battle.UseMove(0)).getFirst().text()).startsWith("Lucifer usou");

        Monster slowed = new Monster(Catalog.LUCIFER, 20);
        slowed.inflict(StatusCondition.PARALYSIS, 0);
        assertThat(battle(slowed, new Monster(Catalog.OLAF, 20), STEADY).submit(new Battle.UseMove(0)).getFirst().text())
                .startsWith("Olaf usou");
    }

    @Test
    void sleepLastsTheRolledTurnsThenWakesUp() {
        Monster hero = new Monster(Catalog.GROOT, 20);
        Monster enemy = new Monster(Catalog.COISO, 20);
        Battle b = battle(hero, enemy, STEADY); // 50: acerta (75%) e sorteia 3 turnos de sono

        List<Event> first = b.submit(new Battle.UseMove(3)); // Cha de camomila
        Event slept = find(first, "Coiso dormiu!");
        assertThat(slept.effect()).isEqualTo(Effect.ENEMY_STATUS);
        assertThat(slept.enemyStatus()).isEqualTo(StatusCondition.SLEEP);
        assertThat(texts(first)).containsSubsequence("Coiso dormiu!", "Coiso esta dormindo...");

        for (int turn = 0; turn < 2; turn++)
            assertThat(texts(b.submit(new Battle.UseMove(0)))).contains("Coiso esta dormindo...");
        assertThat(hero.currentHp()).isEqualTo(hero.maxHp());

        List<Event> woke = b.submit(new Battle.UseMove(0));
        assertThat(texts(woke)).containsSubsequence("Coiso acordou!", "Coiso usou Meteoro!");
        assertThat(find(woke, "Coiso acordou!").effect()).isEqualTo(Effect.ENEMY_CURE);
        assertThat(find(woke, "Coiso acordou!").enemyStatus()).isEqualTo(StatusCondition.NONE);
        assertThat(hero.currentHp()).isLessThan(hero.maxHp());
    }

    @Test
    void statusMoveFailsOnMonsterWithStatusOrImmune() {
        Monster hero = new Monster(Catalog.GROOT, 20);
        Monster enemy = new Monster(Catalog.COISO, 20);
        enemy.inflict(StatusCondition.PARALYSIS, 0);
        List<Event> events = battle(hero, enemy, STEADY).submit(new Battle.UseMove(3));
        assertThat(texts(events)).containsSubsequence("Groot usou Cha de camomila!", "Mas nao funcionou!");
        assertThat(enemy.status()).isEqualTo(StatusCondition.PARALYSIS);

        List<Event> immune = battle(new Monster(Catalog.GROOT, 20), new Monster(Catalog.GROOT, 20), STEADY)
                .submit(new Battle.UseMove(3));
        assertThat(texts(immune)).containsSubsequence("Groot usou Cha de camomila!", "Mas nao funcionou!");
    }

    @Test
    void statusMoveCanMiss() {
        Monster enemy = new Monster(Catalog.COISO, 20);
        List<Event> events = battle(new Monster(Catalog.GROOT, 20), enemy, dice(80)).submit(new Battle.UseMove(3));
        assertThat(texts(events)).containsSubsequence("Groot usou Cha de camomila!", "Errou!");
        assertThat(enemy.status()).isEqualTo(StatusCondition.NONE);
    }

    @Test
    void statusSurvivesSwitchingButEndsWithTheBattle() {
        Monster burned = new Monster(Catalog.GROOT, 20);
        Monster other = new Monster(Catalog.COISO, 20);
        burned.inflict(StatusCondition.BURN, 0);
        Battle b = new Battle(List.of(burned, other), List.of(new Monster(Catalog.COISO, 10)), STEADY, AiStrategy.greedy());

        b.submit(new Battle.Switch(1));
        assertThat(burned.status()).isEqualTo(StatusCondition.BURN);
        List<Event> back = b.submit(new Battle.Switch(0));
        assertThat(back.getFirst().playerStatus()).isEqualTo(StatusCondition.BURN);

        b.submit(new Battle.Run());
        assertThat(b.playerTeam()).allMatch(m -> m.status() == StatusCondition.NONE && m.stages().isEmpty());
    }

    // --- Estagios ---

    @Test
    void raisingMoveBoostsTheUserUntilTheLimit() {
        Monster hero = new Monster(Catalog.COISO, 20);
        Battle b = battle(hero, new Monster(Catalog.OLAF, 10), STEADY);

        Event up = find(b.submit(new Battle.UseMove(2)), "A defesa de Coiso subiu muito!");
        assertThat(up.effect()).isEqualTo(Effect.PLAYER_STAT_UP);
        b.submit(new Battle.UseMove(2));
        b.submit(new Battle.UseMove(2));
        assertThat(hero.stage(Stat.DEF)).isEqualTo(6);
        assertThat(texts(b.submit(new Battle.UseMove(2)))).contains("A defesa de Coiso nao sobe mais!");
    }

    @Test
    void loweringMoveWeakensTheTargetAndChangesTurnOrder() {
        Monster hero = new Monster(Catalog.LINDOYA, 20); // velocidade 22 contra 25 do Olaf
        Monster enemy = new Monster(Catalog.OLAF, 20);
        Battle b = battle(hero, enemy, STEADY);

        List<Event> first = b.submit(new Battle.UseMove(2)); // Piso molhado: VEL -2 no alvo
        assertThat(first.getFirst().text()).startsWith("Olaf usou");
        Event down = find(first, "A velocidade de Olaf caiu muito!");
        assertThat(down.effect()).isEqualTo(Effect.ENEMY_STAT_DOWN);
        assertThat(enemy.stage(Stat.SPD)).isEqualTo(-2);

        assertThat(b.submit(new Battle.UseMove(0)).getFirst().text()).startsWith("Lindoya usou");
    }

    @Test
    void enemyStatMovesAffectTheRightSide() {
        Monster hero = new Monster(Catalog.COISO, 20);
        Monster enemy = new Monster(Catalog.OLAF, 20);
        Battle b = new Battle(List.of(hero), List.of(enemy), STEADY, (self, target) -> 2); // Frio na barriga
        Event down = find(b.submit(new Battle.UseMove(2)), "O ataque de Coiso caiu muito!");
        assertThat(down.effect()).isEqualTo(Effect.PLAYER_STAT_DOWN);
        assertThat(hero.stage(Stat.ATK)).isEqualTo(-2);
    }

    @Test
    void secondaryStatDropOnlyWithItsChance() {
        Monster steadyTarget = new Monster(Catalog.COISO, 30);
        battle(new Monster(Catalog.LINDOYA, 20), steadyTarget, STEADY).submit(new Battle.UseMove(3)); // Agua de salsicha, 30%
        assertThat(steadyTarget.stage(Stat.ATK)).isZero();

        Monster luckyTarget = new Monster(Catalog.COISO, 30);
        List<Event> events = battle(new Monster(Catalog.LINDOYA, 20), luckyTarget, LUCKY).submit(new Battle.UseMove(3));
        assertThat(texts(events)).contains("O ataque de Coiso caiu!");
        assertThat(luckyTarget.stage(Stat.ATK)).isEqualTo(-1);
    }

    @Test
    void switchingOutResetsStages() {
        Monster lead = new Monster(Catalog.COISO, 20);
        Battle b = new Battle(List.of(lead, new Monster(Catalog.GROOT, 20)), List.of(new Monster(Catalog.OLAF, 10)),
                STEADY, AiStrategy.greedy());
        b.submit(new Battle.UseMove(2));
        assertThat(lead.stage(Stat.DEF)).isEqualTo(2);
        b.submit(new Battle.Switch(1));
        assertThat(lead.stages()).isEmpty();
    }

    @Test
    void stateRoundTripKeepsBattleConditions() {
        Monster hero = new Monster(Catalog.GROOT, 20);
        Monster enemy = new Monster(Catalog.COISO, 20);
        Battle b = battle(hero, enemy, STEADY);
        b.submit(new Battle.UseMove(3));

        Battle restored = Battle.restore(b.state(), STEADY, AiStrategy.greedy());
        assertThat(restored.enemyMonster().status()).isEqualTo(StatusCondition.SLEEP);
        assertThat(restored.enemyMonster().sleepTurns()).isEqualTo(2);
    }
}
