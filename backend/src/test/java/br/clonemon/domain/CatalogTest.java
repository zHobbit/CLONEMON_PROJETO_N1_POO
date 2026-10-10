package br.clonemon.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** Regras que todo clonemon do catalogo segue; um clonemon novo que fuja delas quebra aqui. */
class CatalogTest {

    @Test
    void everyClonemonLearnsFourMovesAtLevelsOneSevenAndTwelve() {
        for (Species s : Catalog.ALL) {
            assertThat(s.moves()).as(s.name()).hasSize(4);
            assertThat(s.knownMoveCount(6)).as(s.name() + " no nivel 6").isEqualTo(2);
            assertThat(s.knownMoveCount(7)).as(s.name() + " no nivel 7").isEqualTo(3);
            assertThat(s.knownMoveCount(12)).as(s.name() + " no nivel 12").isEqualTo(4);
        }
    }

    @Test
    void movesShareTheClonemonElementAndHaveUniqueNames() {
        for (Species s : Catalog.ALL)
            assertThat(s.moves()).as(s.name()).allSatisfy(m -> assertThat(m.element()).isEqualTo(s.element()));
        assertThat(Catalog.ALL.stream().flatMap(s -> s.moves().stream()).map(Move::name)).doesNotHaveDuplicates();
    }

    @Test
    void moveNamesFitTheBattleMenu() {
        assertThat(Catalog.ALL.stream().flatMap(s -> s.moves().stream()).map(Move::name))
                .allSatisfy(name -> assertThat(name.length()).isLessThanOrEqualTo(19));
    }
}
