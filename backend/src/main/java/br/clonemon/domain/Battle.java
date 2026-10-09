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

    /** Efeito visual associado a um evento, para a interface animar. */
    public enum Effect { NONE, PLAYER_HIT, ENEMY_HIT, PLAYER_FAINT, ENEMY_FAINT, PLAYER_SWITCH, ENEMY_SWITCH, WON, LOST, FLED }

    /** Um passo do turno, com o estado visivel logo apos ele (monstro ativo e HP de cada lado). */
    public record Event(String text, Effect effect, int playerActive, int playerHp, int enemyHp) {}

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
    public List<Event> submit(Action action) {
        if (isFinished()) throw new IllegalStateException("Battle finished");
        List<Event> events = new ArrayList<>();

        switch (action) {
            case Run r -> {
                status = Status.FLED;
                events.add(event("Voce fugiu!", Effect.FLED));
            }
            case Switch s -> {
                validateSwitch(s.teamIndex());
                playerActive = s.teamIndex();
                events.add(event("Vai, " + playerMonster().species().name() + "!", Effect.PLAYER_SWITCH));
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
        events.forEach(e -> log.add(e.text()));
        return events;
    }

    /** Evento sem efeito visual, com o estado atual; usado para mensagens fora do turno. */
    public Event narrate(String text) {
        return event(text, Effect.NONE);
    }

    private Event event(String text, Effect effect) {
        return new Event(text, effect, playerActive, playerMonster().currentHp(), enemyMonster().currentHp());
    }

    private void attack(Monster atk, Monster def, int moveIdx, List<Event> events) {
        boolean playerAttacking = atk == playerMonster();
        Move move = atk.use(moveIdx);
        DamageCalculator.Result r = calc.calculate(atk, def, move);
        if (r.hit()) def.takeDamage(r.damage());
        Effect hit = !r.hit() ? Effect.NONE : playerAttacking ? Effect.ENEMY_HIT : Effect.PLAYER_HIT;
        events.add(event(atk.species().name() + " usou " + move.name() + "!", hit));
        if (!r.hit()) { events.add(event("Errou!", Effect.NONE)); return; }
        if (r.critical()) events.add(event("Golpe critico!", Effect.NONE));
        if (r.effectiveness() > 1) events.add(event("E super efetivo!", Effect.NONE));
        if (r.effectiveness() < 1) events.add(event("Nao e muito efetivo...", Effect.NONE));
        if (def.isFainted())
            events.add(event(def.species().name() + " desmaiou!", playerAttacking ? Effect.ENEMY_FAINT : Effect.PLAYER_FAINT));
    }

    private void resolveFaints(List<Event> events) {
        if (enemyMonster().isFainted()) {
            if (!playerMonster().isFainted()) {
                int xp = ExperienceCurve.xpReward(enemyMonster().level());
                int gained = playerMonster().gainXp(xp);
                events.add(event(playerMonster().species().name() + " ganhou " + xp + " XP!", Effect.NONE));
                if (gained > 0)
                    events.add(event(playerMonster().species().name() + " subiu para o nivel " + playerMonster().level() + "!", Effect.NONE));
            }
            int next = firstAlive(enemyTeam);
            if (next < 0) { status = Status.PLAYER_WON; events.add(event("Voce venceu!", Effect.WON)); return; }
            enemyActive = next;
            events.add(event("Oponente enviou " + enemyMonster().species().name() + "!", Effect.ENEMY_SWITCH));
        }
        if (playerMonster().isFainted()) {
            int next = firstAlive(playerTeam);
            if (next < 0) { status = Status.PLAYER_LOST; events.add(event("Voce perdeu...", Effect.LOST)); return; }
            playerActive = next;
            events.add(event("Vai, " + playerMonster().species().name() + "!", Effect.PLAYER_SWITCH));
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
