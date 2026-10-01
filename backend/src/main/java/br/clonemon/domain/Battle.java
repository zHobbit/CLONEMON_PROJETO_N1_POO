package br.clonemon.domain;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Battle {
    public enum Status { AWAITING_ACTION, PLAYER_WON, PLAYER_LOST, FLED }

    public sealed interface Action permits UseMove, Switch, Run {}
    public record UseMove(int moveIndex) implements Action {}
    public record Switch(int teamIndex) implements Action {}
    public record Run() implements Action {}

    /** Estado completo para persistencia. */
    public record State(List<Monster> playerTeam, List<Monster> enemyTeam, int playerActive, int enemyActive,
                        Status status, List<String> log) {
        public State {
            playerTeam = List.copyOf(playerTeam);
            enemyTeam = List.copyOf(enemyTeam);
            log = List.copyOf(log);
        }
    }

    private final List<Monster> playerTeam;
    private final List<Monster> enemyTeam;
    private final DamageCalculator calc;
    private final AiStrategy ai;
    private int playerActive;
    private int enemyActive;
    private Status status;
    private final List<String> log;

    public Battle(List<Monster> playerTeam, List<Monster> enemyTeam, DamageCalculator calc, AiStrategy ai) {
        this(playerTeam, enemyTeam, firstAlive(playerTeam), 0, Status.AWAITING_ACTION, List.of(), calc, ai);
        if (enemyTeam.isEmpty()) throw new IllegalArgumentException("Enemy team empty");
    }

    private Battle(List<Monster> playerTeam, List<Monster> enemyTeam, int playerActive, int enemyActive,
                   Status status, List<String> log, DamageCalculator calc, AiStrategy ai) {
        if (playerActive < 0) throw new IllegalArgumentException("Player team has no usable monster");
        this.playerTeam = List.copyOf(playerTeam);
        this.enemyTeam = List.copyOf(enemyTeam);
        this.playerActive = playerActive;
        this.enemyActive = enemyActive;
        this.status = status;
        this.log = new ArrayList<>(log);
        this.calc = calc;
        this.ai = ai;
    }

    public static Battle restore(State s, DamageCalculator calc, AiStrategy ai) {
        if (s.playerActive() >= s.playerTeam().size() || s.enemyActive() < 0 || s.enemyActive() >= s.enemyTeam().size())
            throw new IllegalArgumentException("Active index out of range");
        return new Battle(s.playerTeam(), s.enemyTeam(), s.playerActive(), s.enemyActive(), s.status(), s.log(), calc, ai);
    }

    public State state() {
        return new State(playerTeam, enemyTeam, playerActive, enemyActive, status, log);
    }

    public Status status() { return status; }
    public boolean isFinished() { return status != Status.AWAITING_ACTION; }
    public List<Monster> playerTeam() { return playerTeam; }
    public List<Monster> enemyTeam() { return enemyTeam; }
    public int playerActiveIndex() { return playerActive; }
    public Monster playerMonster() { return playerTeam.get(playerActive); }
    public Monster enemyMonster() { return enemyTeam.get(enemyActive); }
    public List<String> log() { return Collections.unmodifiableList(log); }

    /** Executa um turno completo e retorna os eventos gerados neste turno. */
    public List<String> submit(Action action) {
        if (isFinished()) throw new IllegalStateException("Battle finished");
        List<String> events = new ArrayList<>();

        switch (action) {
            case Run r -> {
                status = Status.FLED;
                events.add("Voce fugiu!");
            }
            case Switch s -> {
                validateSwitch(s.teamIndex());
                playerActive = s.teamIndex();
                events.add("Vai, " + playerMonster().species().name() + "!");
                attack(enemyMonster(), playerMonster(), ai.chooseMove(enemyMonster(), playerMonster()), events);
            }
            case UseMove m -> {
                if (!playerMonster().canUse(m.moveIndex())) throw new IllegalArgumentException("Move unavailable");
                int enemyMove = ai.chooseMove(enemyMonster(), playerMonster());
                if (playerMonster().speed() >= enemyMonster().speed()) {
                    attack(playerMonster(), enemyMonster(), m.moveIndex(), events);
                    if (!enemyMonster().isFainted()) attack(enemyMonster(), playerMonster(), enemyMove, events);
                } else {
                    attack(enemyMonster(), playerMonster(), enemyMove, events);
                    if (!playerMonster().isFainted()) attack(playerMonster(), enemyMonster(), m.moveIndex(), events);
                }
            }
        }
        if (!isFinished()) resolveFaints(events);
        log.addAll(events);
        return events;
    }

    private void attack(Monster atk, Monster def, int moveIdx, List<String> events) {
        Move move = atk.use(moveIdx);
        events.add(atk.species().name() + " usou " + move.name() + "!");
        DamageCalculator.Result r = calc.calculate(atk, def, move);
        if (!r.hit()) { events.add("Errou!"); return; }
        def.takeDamage(r.damage());
        if (r.critical()) events.add("Golpe critico!");
        if (r.effectiveness() > 1) events.add("E super efetivo!");
        if (r.effectiveness() < 1) events.add("Nao e muito efetivo...");
        if (def.isFainted()) events.add(def.species().name() + " desmaiou!");
    }

    private void resolveFaints(List<String> events) {
        if (enemyMonster().isFainted()) {
            if (!playerMonster().isFainted()) {
                int xp = ExperienceCurve.xpReward(enemyMonster().level());
                int gained = playerMonster().gainXp(xp);
                events.add(playerMonster().species().name() + " ganhou " + xp + " XP!");
                if (gained > 0) events.add(playerMonster().species().name() + " subiu para o nivel " + playerMonster().level() + "!");
            }
            int next = firstAlive(enemyTeam);
            if (next < 0) { status = Status.PLAYER_WON; events.add("Voce venceu!"); return; }
            enemyActive = next;
            events.add("Oponente enviou " + enemyMonster().species().name() + "!");
        }
        if (playerMonster().isFainted()) {
            int next = firstAlive(playerTeam);
            if (next < 0) { status = Status.PLAYER_LOST; events.add("Voce perdeu..."); return; }
            playerActive = next;
            events.add("Vai, " + playerMonster().species().name() + "!");
        }
    }

    private void validateSwitch(int idx) {
        if (idx < 0 || idx >= playerTeam.size() || idx == playerActive || playerTeam.get(idx).isFainted())
            throw new IllegalArgumentException("Invalid switch: " + idx);
    }

    private static int firstAlive(List<Monster> team) {
        for (int i = 0; i < team.size(); i++) if (!team.get(i).isFainted()) return i;
        return -1;
    }
}
