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
    public enum Effect {
        NONE, PLAYER_HIT, ENEMY_HIT, PLAYER_FAINT, ENEMY_FAINT, PLAYER_SWITCH, ENEMY_SWITCH, WON, LOST, FLED,
        /** Ganhou um status (o novo status vem no proprio evento). */
        PLAYER_STATUS, ENEMY_STATUS,
        /** Acordou ou descongelou. */
        PLAYER_CURE, ENEMY_CURE,
        /** Dano da queimadura no fim do turno. */
        PLAYER_STATUS_DAMAGE, ENEMY_STATUS_DAMAGE,
        PLAYER_STAT_UP, PLAYER_STAT_DOWN, ENEMY_STAT_UP, ENEMY_STAT_DOWN,
        /** O monstro do jogador aprendeu um golpe ao subir de nivel. */
        MOVE_LEARNED
    }

    /** Um passo do turno, com o estado visivel logo apos ele (monstro ativo, HP e status de cada lado). */
    public record Event(String text, Effect effect, int playerActive, int playerHp, int enemyHp,
                        StatusCondition playerStatus, StatusCondition enemyStatus) {}

    /** Estado completo para persistencia. Status e estagios ficam dentro de cada monstro. */
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
                playerMonster().resetStages();
                playerActive = s.teamIndex();
                events.add(event("Vai, " + playerMonster().species().name() + "!", Effect.PLAYER_SWITCH));
                act(enemyMonster(), playerMonster(), ai.chooseMove(enemyMonster(), playerMonster()), events);
                endOfTurn(events);
            }
            case UseMove m -> {
                if (!playerMonster().canUse(m.moveIndex())) throw new IllegalArgumentException("Move unavailable");
                Monster player = playerMonster();
                Monster enemy = enemyMonster();
                int enemyMove = ai.chooseMove(enemy, player);
                if (player.effectiveSpeed() >= enemy.effectiveSpeed()) {
                    act(player, enemy, m.moveIndex(), events);
                    if (!enemy.isFainted()) act(enemy, player, enemyMove, events);
                } else {
                    act(enemy, player, enemyMove, events);
                    if (!player.isFainted()) act(player, enemy, m.moveIndex(), events);
                }
                endOfTurn(events);
            }
        }
        if (!isFinished()) resolveFaints(events);
        if (isFinished()) {
            playerTeam.forEach(Monster::clearBattleState);
            enemyTeam.forEach(Monster::clearBattleState);
        }
        events.forEach(e -> log.add(e.text()));
        return events;
    }

    /** Evento sem efeito visual, com o estado atual; usado para mensagens fora do turno. */
    public Event narrate(String text) {
        return event(text, Effect.NONE);
    }

    private Event event(String text, Effect effect) {
        return new Event(text, effect, playerActive, playerMonster().currentHp(), enemyMonster().currentHp(),
                playerMonster().status(), enemyMonster().status());
    }

    /** Efeito do lado do monstro dado: o do jogador ou o do oponente. */
    private Effect sideEffect(Monster m, Effect ifPlayer, Effect ifEnemy) {
        return m == playerMonster() ? ifPlayer : ifEnemy;
    }

    /** O status pode impedir o monstro de agir; se nao impedir, ele usa o golpe. */
    private void act(Monster atk, Monster def, int moveIdx, List<Event> events) {
        if (canAct(atk, events)) attack(atk, def, moveIdx, events);
    }

    private boolean canAct(Monster m, List<Event> events) {
        String name = m.species().name();
        return switch (m.status()) {
            case SLEEP -> {
                if (m.sleepTurns() > 0) {
                    m.sleepTick();
                    events.add(event(name + " esta dormindo...", Effect.NONE));
                    yield false;
                }
                m.cure();
                events.add(event(name + " acordou!", sideEffect(m, Effect.PLAYER_CURE, Effect.ENEMY_CURE)));
                yield true;
            }
            case FREEZE -> {
                if (!calc.chance(StatusCondition.THAW_CHANCE)) {
                    events.add(event(name + " esta congelado!", Effect.NONE));
                    yield false;
                }
                m.cure();
                events.add(event(name + " descongelou!", sideEffect(m, Effect.PLAYER_CURE, Effect.ENEMY_CURE)));
                yield true;
            }
            case PARALYSIS -> {
                boolean stuck = calc.chance(StatusCondition.FULL_PARALYSIS_CHANCE);
                if (stuck) events.add(event(name + " esta paralisado! Nao conseguiu se mover!", Effect.NONE));
                yield !stuck;
            }
            case NONE, BURN -> true;
        };
    }

    private void attack(Monster atk, Monster def, int moveIdx, List<Event> events) {
        boolean playerAttacking = atk == playerMonster();
        Move move = atk.use(moveIdx);
        DamageCalculator.Result r = calc.calculate(atk, def, move);
        if (r.hit()) def.takeDamage(r.damage());
        boolean damaged = r.hit() && move.isDamaging();
        Effect hit = !damaged ? Effect.NONE : playerAttacking ? Effect.ENEMY_HIT : Effect.PLAYER_HIT;
        events.add(event(atk.species().name() + " usou " + move.name() + "!", hit));
        if (!r.hit()) { events.add(event("Errou!", Effect.NONE)); return; }
        if (r.critical()) events.add(event("Golpe critico!", Effect.NONE));
        if (r.effectiveness() > 1) events.add(event("E super efetivo!", Effect.NONE));
        if (r.effectiveness() < 1) events.add(event("Nao e muito efetivo...", Effect.NONE));
        if (def.isFainted()) {
            events.add(event(def.species().name() + " desmaiou!", playerAttacking ? Effect.ENEMY_FAINT : Effect.PLAYER_FAINT));
            return;
        }
        applyEffect(atk, def, move, events);
    }

    /** Efeito secundario. Num golpe de status, avisa quando nao funciona; num golpe de dano, falha em silencio. */
    private void applyEffect(Monster atk, Monster def, Move move, List<Event> events) {
        MoveEffect fx = move.effect();
        if (fx.kind() == MoveEffect.Kind.NONE || !calc.chance(fx.chance())) return;
        boolean announceFailure = !move.isDamaging();
        switch (fx.kind()) {
            case RAISE -> changeStage(atk, fx.stat(), fx.stages(), announceFailure, events);
            case LOWER -> changeStage(def, fx.stat(), -fx.stages(), announceFailure, events);
            default -> inflict(def, fx.status(), announceFailure, events);
        }
    }

    private void inflict(Monster target, StatusCondition s, boolean announceFailure, List<Event> events) {
        if (!target.canGet(s)) {
            if (announceFailure) events.add(event("Mas nao funcionou!", Effect.NONE));
            return;
        }
        int turns = s == StatusCondition.SLEEP
                ? calc.between(StatusCondition.MIN_SLEEP_TURNS, StatusCondition.MAX_SLEEP_TURNS) : 0;
        target.inflict(s, turns);
        String name = target.species().name();
        String text = switch (s) {
            case BURN -> name + " pegou fogo!";
            case FREEZE -> name + " congelou!";
            case PARALYSIS -> name + " ficou paralisado!";
            case SLEEP -> name + " dormiu!";
            case NONE -> throw new IllegalArgumentException("No status to inflict");
        };
        events.add(event(text, sideEffect(target, Effect.PLAYER_STATUS, Effect.ENEMY_STATUS)));
    }

    private void changeStage(Monster m, Stat stat, int delta, boolean announceFailure, List<Event> events) {
        int changed = m.changeStage(stat, delta);
        String subject = stat.label() + " de " + m.species().name();
        if (changed == 0) {
            if (announceFailure) events.add(event(subject + (delta > 0 ? " nao sobe mais!" : " nao cai mais!"), Effect.NONE));
            return;
        }
        String text = subject + (changed > 0 ? " subiu" : " caiu") + (Math.abs(changed) >= 2 ? " muito!" : "!");
        Effect effect = changed > 0
                ? sideEffect(m, Effect.PLAYER_STAT_UP, Effect.ENEMY_STAT_UP)
                : sideEffect(m, Effect.PLAYER_STAT_DOWN, Effect.ENEMY_STAT_DOWN);
        events.add(event(text, effect));
    }

    /** Fim do turno: a queimadura tira 1/16 do HP maximo de quem ainda esta de pe. */
    private void endOfTurn(List<Event> events) {
        burn(playerMonster(), events);
        burn(enemyMonster(), events);
    }

    private void burn(Monster m, List<Event> events) {
        if (m.isFainted() || m.status() != StatusCondition.BURN) return;
        m.takeDamage(Math.max(1, m.maxHp() / StatusCondition.BURN_DAMAGE_DIVISOR));
        String name = m.species().name();
        events.add(event(name + " sofreu com a queimadura!",
                sideEffect(m, Effect.PLAYER_STATUS_DAMAGE, Effect.ENEMY_STATUS_DAMAGE)));
        if (m.isFainted())
            events.add(event(name + " desmaiou!", sideEffect(m, Effect.PLAYER_FAINT, Effect.ENEMY_FAINT)));
    }

    private void resolveFaints(List<Event> events) {
        if (enemyMonster().isFainted()) {
            Monster player = playerMonster();
            if (!player.isFainted()) {
                int known = player.moves().size();
                int xp = ExperienceCurve.xpReward(enemyMonster().level());
                int gained = player.gainXp(xp);
                String name = player.species().name();
                events.add(event(name + " ganhou " + xp + " XP!", Effect.NONE));
                if (gained > 0)
                    events.add(event(name + " subiu para o nivel " + player.level() + "!", Effect.NONE));
                for (Move learned : player.moves().subList(known, player.moves().size()))
                    events.add(event(name + " aprendeu " + learned.name() + "!", Effect.MOVE_LEARNED));
            }
            enemyMonster().clearBattleState();
            int next = firstAlive(enemyTeam);
            if (next < 0) { status = Status.PLAYER_WON; events.add(event("Voce venceu!", Effect.WON)); return; }
            enemyActive = next;
            events.add(event("Oponente enviou " + enemyMonster().species().name() + "!", Effect.ENEMY_SWITCH));
        }
        if (playerMonster().isFainted()) {
            playerMonster().clearBattleState();
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
