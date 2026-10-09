package br.clonemon.domain;

import java.util.List;

/** Fixture com os 6 clonemons originais (espelha V2__seed.sql). */
public final class Catalog {
    private Catalog() {}

    public static final Species LINDOYA = new Species(1, "Lindoya", Element.AGUA, 44, 48, 65, 43,
            List.of(new Move("Cuspe", Element.AGUA, 40, 100, 25), new Move("Vap de alta pressao", Element.AGUA, 90, 85, 10)));
    public static final Species COISO = new Species(2, "Coiso", Element.ROCHA, 50, 55, 75, 30,
            List.of(new Move("Pedrada", Element.ROCHA, 40, 100, 25), new Move("Meteoro", Element.ROCHA, 90, 85, 10)));
    public static final Species LUCIFER = new Species(3, "Lucifer", Element.FOGO, 39, 62, 43, 65,
            List.of(new Move("Molotov", Element.FOGO, 40, 100, 25), new Move("Fogo na Babilonia", Element.FOGO, 90, 85, 10)));
    public static final Species OLAF = new Species(4, "Olaf", Element.GELO, 48, 50, 55, 50,
            List.of(new Move("Cubo de gelo", Element.GELO, 40, 100, 25), new Move("Fica frio ai", Element.GELO, 90, 85, 10)));
    public static final Species GROOT = new Species(5, "Groot", Element.GRAMA, 55, 49, 60, 40,
            List.of(new Move("Corte de papel A4", Element.GRAMA, 40, 100, 25), new Move("Cartolinada", Element.GRAMA, 90, 85, 10)));
    public static final Species ELETROPAULO = new Species(6, "EletroPaulo", Element.RAIO, 35, 55, 40, 90,
            List.of(new Move("Volt", Element.RAIO, 40, 100, 25), new Move("Bivolt", Element.RAIO, 90, 85, 10)));

    public static final List<Species> ALL = List.of(LINDOYA, COISO, LUCIFER, OLAF, GROOT, ELETROPAULO);
}
