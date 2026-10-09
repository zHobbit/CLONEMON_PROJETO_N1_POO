package br.clonemon.domain;

import java.util.List;

import static br.clonemon.domain.MoveEffect.inflict;
import static br.clonemon.domain.MoveEffect.lower;
import static br.clonemon.domain.MoveEffect.raise;

/** Fixture com os 6 clonemons originais (espelha V2__seed.sql e V3__battle_content.sql). */
public final class Catalog {
    private Catalog() {}

    /** Os dois golpes originais no nivel 1 e os novos nos niveis 7 e 12. */
    private static final List<Integer> LEARN_LEVELS = List.of(1, 1, 7, 12);

    public static final Species LINDOYA = new Species(1, "Lindoya", Element.AGUA, 44, 48, 65, 43,
            List.of(new Move("Cuspe", Element.AGUA, 40, 100, 25), new Move("Vap de alta pressao", Element.AGUA, 90, 85, 10),
                    new Move("Piso molhado", Element.AGUA, 0, 100, 20, lower(Stat.SPD, 2, 100)),
                    new Move("Agua de salsicha", Element.AGUA, 80, 90, 10, lower(Stat.ATK, 1, 30))), LEARN_LEVELS);
    public static final Species COISO = new Species(2, "Coiso", Element.ROCHA, 50, 55, 75, 30,
            List.of(new Move("Pedrada", Element.ROCHA, 40, 100, 25), new Move("Meteoro", Element.ROCHA, 90, 85, 10),
                    new Move("Casca grossa", Element.ROCHA, 0, 100, 20, raise(Stat.DEF, 2)),
                    new Move("Pedra no sapato", Element.ROCHA, 80, 90, 10, lower(Stat.SPD, 1, 30))), LEARN_LEVELS);
    public static final Species LUCIFER = new Species(3, "Lucifer", Element.FOGO, 39, 62, 43, 65,
            List.of(new Move("Molotov", Element.FOGO, 40, 100, 25), new Move("Fogo na Babilonia", Element.FOGO, 90, 85, 10),
                    new Move("Churrasco grego", Element.FOGO, 60, 100, 15, inflict(StatusCondition.BURN, 30)),
                    new Move("Sangue nos olhos", Element.FOGO, 0, 100, 15, raise(Stat.ATK, 2))), LEARN_LEVELS);
    public static final Species OLAF = new Species(4, "Olaf", Element.GELO, 48, 50, 55, 50,
            List.of(new Move("Cubo de gelo", Element.GELO, 40, 100, 25), new Move("Fica frio ai", Element.GELO, 90, 85, 10),
                    new Move("Frio na barriga", Element.GELO, 0, 100, 15, lower(Stat.ATK, 2, 100)),
                    new Move("Picole de chuchu", Element.GELO, 75, 95, 10, inflict(StatusCondition.FREEZE, 15))), LEARN_LEVELS);
    public static final Species GROOT = new Species(5, "Groot", Element.GRAMA, 55, 49, 60, 40,
            List.of(new Move("Corte de papel A4", Element.GRAMA, 40, 100, 25), new Move("Cartolinada", Element.GRAMA, 90, 85, 10),
                    new Move("Urtigada", Element.GRAMA, 60, 100, 15, lower(Stat.DEF, 1, 30)),
                    new Move("Cha de camomila", Element.GRAMA, 0, 75, 10, inflict(StatusCondition.SLEEP, 100))), LEARN_LEVELS);
    public static final Species ELETROPAULO = new Species(6, "EletroPaulo", Element.RAIO, 35, 55, 40, 90,
            List.of(new Move("Volt", Element.RAIO, 40, 100, 25), new Move("Bivolt", Element.RAIO, 90, 85, 10),
                    new Move("Conta de luz", Element.RAIO, 0, 90, 15, lower(Stat.DEF, 2, 100)),
                    new Move("Dedo na tomada", Element.RAIO, 80, 95, 10, inflict(StatusCondition.PARALYSIS, 30))), LEARN_LEVELS);

    public static final List<Species> ALL = List.of(LINDOYA, COISO, LUCIFER, OLAF, GROOT, ELETROPAULO);
}
