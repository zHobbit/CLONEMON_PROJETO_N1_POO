package br.clonemon.domain;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.SplittableRandom;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Balanceamento dos treinadores do mapa: todo inicial precisa ter chance real contra cada treinador.
 * O jogador-robo escolhe golpes ao acaso (um iniciante, o pior caso); o treinador usa a IA gulosa do jogo.
 * Antes do primeiro treinador o jogador so tem o inicial; depois ja recrutou monstros, sorteados aqui.
 * Semente fixa: o resultado so muda quando o conteudo ou as regras de batalha mudam.
 */
class BalanceTest {

    private static final int BATTLES = 200;
    private static final long SEED = 20261024L;
    private static final List<Species> STARTERS = Catalog.ALL.subList(0, 6);

    /** Time esperado ao chegar no treinador (inicial + recrutas dois niveis abaixo) e a vitoria minima aceita. */
    private record Scenario(NpcTrainer npc, int starterLevel, int recruits, double minWinRate) {}

    private static final List<Scenario> SCENARIOS = List.of(
            new Scenario(Catalog.CAIO, 5, 0, 0.50),
            new Scenario(Catalog.BIA, 9, 1, 0.30),
            new Scenario(Catalog.ZECA, 12, 2, 0.30));

    @Test
    void everyStarterHasAFairChanceAgainstEveryTrainer() {
        StringBuilder table = new StringBuilder("\nTaxa de vitoria (" + BATTLES + " batalhas por par)\n");
        List<String> tooHard = new ArrayList<>();
        for (Scenario sc : SCENARIOS) {
            table.append(String.format("%-5s (inicial nv %d + %d recruta(s), minimo %.0f%%):",
                    sc.npc().name(), sc.starterLevel(), sc.recruits(), sc.minWinRate() * 100));
            for (Species starter : STARTERS) {
                double rate = winRate(starter, sc);
                table.append(String.format(" %s %.0f%%", starter.name(), rate * 100));
                if (rate < sc.minWinRate())
                    tooHard.add(String.format("%s vs %s: %.0f%%", starter.name(), sc.npc().name(), rate * 100));
            }
            table.append('\n');
        }
        System.out.println(table);
        assertThat(tooHard).as("iniciais com chance baixa demais" + table).isEmpty();
    }

    private static double winRate(Species starter, Scenario sc) {
        SplittableRandom rng = new SplittableRandom(SEED ^ starter.id() * 31 ^ sc.npc().id().hashCode());
        DamageCalculator calc = new DamageCalculator(rng);
        int wins = 0;
        for (int i = 0; i < BATTLES; i++) {
            Battle battle = new Battle(team(starter, sc, rng), sc.npc().freshTeam(), sc.npc().name(), calc, AiStrategy.greedy());
            while (!battle.isFinished()) {
                List<Integer> usable = battle.playerMonster().usableMoves();
                if (usable.isEmpty()) break; // sem PP: conta como derrota
                battle.submit(new Battle.UseMove(usable.get(rng.nextInt(usable.size()))));
            }
            if (battle.status() == Battle.Status.PLAYER_WON) wins++;
        }
        return wins / (double) BATTLES;
    }

    private static List<Monster> team(Species starter, Scenario sc, SplittableRandom rng) {
        List<Monster> team = new ArrayList<>(List.of(new Monster(starter, sc.starterLevel())));
        List<Species> others = new ArrayList<>(Catalog.ALL);
        others.remove(starter);
        for (int i = 0; i < sc.recruits(); i++)
            team.add(new Monster(others.remove(rng.nextInt(others.size())), sc.starterLevel() - 2));
        return team;
    }
}
