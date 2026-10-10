package br.clonemon.web.dto;

import br.clonemon.application.BattleService;
import br.clonemon.application.BattleSession;
import br.clonemon.domain.Battle;
import br.clonemon.domain.Element;
import br.clonemon.domain.Monster;
import br.clonemon.domain.StatusCondition;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.stream.IntStream;

public final class BattleDtos {
    private BattleDtos() {}

    /** Monstro em combate. Os golpes do oponente ficam ocultos ({@code moves} nulo). */
    public record CombatantDto(Long monsterId, long speciesId, String name, Element element, int level,
                               int currentHp, int maxHp, boolean fainted, StatusCondition status, List<MoveDto> moves) {
        static CombatantDto of(Long monsterId, Monster m, boolean showMoves) {
            return new CombatantDto(monsterId, m.species().id(), m.species().name(), m.species().element(), m.level(),
                    m.currentHp(), m.maxHp(), m.isFainted(), m.status(), showMoves ? MoveDto.of(m) : null);
        }
    }

    public record BattleDto(long id, Battle.Status status, int playerActive, List<CombatantDto> playerTeam,
                            CombatantDto enemy, List<String> log) {
        public static BattleDto of(BattleSession s) {
            Battle b = s.battle();
            List<CombatantDto> team = IntStream.range(0, b.playerTeam().size())
                    .mapToObj(i -> CombatantDto.of(s.playerMonsterIds().get(i), b.playerTeam().get(i), true))
                    .toList();
            return new BattleDto(s.id(), b.status(), b.playerActiveIndex(), team,
                    CombatantDto.of(null, b.enemyMonster(), false), b.log());
        }
    }

    public record TurnRequest(@NotNull ActionType action, @Min(0) Integer moveIndex, @Min(0) Integer teamIndex) {
        public enum ActionType { MOVE, SWITCH, RUN }

        public Battle.Action toAction() {
            return switch (action) {
                case MOVE -> new Battle.UseMove(require(moveIndex, "moveIndex"));
                case SWITCH -> new Battle.Switch(require(teamIndex, "teamIndex"));
                case RUN -> new Battle.Run();
            };
        }

        private static int require(Integer value, String field) {
            if (value == null) throw new IllegalArgumentException(field + " is required for this action");
            return value;
        }
    }

    public record TurnResponse(List<Battle.Event> events, BattleDto battle) {
        public static TurnResponse of(BattleService.TurnResult r) {
            return new TurnResponse(r.events(), BattleDto.of(r.session()));
        }
    }
}
