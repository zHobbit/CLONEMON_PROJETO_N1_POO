package br.clonemon.web.dto;

import br.clonemon.application.WorldService;
import br.clonemon.domain.WorldPosition;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public final class WorldDtos {
    private WorldDtos() {}

    /** Posicao no mapa, em ladrilhos (0 a 199 nos dois eixos; o dominio valida). */
    public record PositionDto(@NotNull Integer x, @NotNull Integer y, @NotNull WorldPosition.Facing facing) {
        static PositionDto of(WorldPosition p) {
            return new PositionDto(p.x(), p.y(), p.facing());
        }

        public WorldPosition toDomain() {
            return new WorldPosition(x, y, facing);
        }
    }

    /** {@code position} e nula ate o treinador salvar uma; o frontend usa entao o ponto de partida do mapa. */
    public record WorldDto(PositionDto position, List<String> defeatedNpcs) {
        public static WorldDto of(WorldService.World w) {
            return new WorldDto(w.position() == null ? null : PositionDto.of(w.position()), w.defeatedNpcs());
        }
    }
}
