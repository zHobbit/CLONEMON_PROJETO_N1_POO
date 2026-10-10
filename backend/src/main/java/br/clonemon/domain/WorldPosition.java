package br.clonemon.domain;

/** Posicao do treinador no mapa do mundo, em ladrilhos, e para onde ele esta olhando. */
public record WorldPosition(int x, int y, Facing facing) {
    public enum Facing { UP, DOWN, LEFT, RIGHT }

    /** Maior coordenada aceita nos dois eixos (o mapa tem no maximo 200x200 ladrilhos). */
    public static final int MAX_COORDINATE = 199;

    public WorldPosition {
        if (x < 0 || x > MAX_COORDINATE || y < 0 || y > MAX_COORDINATE)
            throw new IllegalArgumentException("Position out of the map: (" + x + ", " + y + ")");
        if (facing == null) throw new IllegalArgumentException("Facing is required");
    }
}
