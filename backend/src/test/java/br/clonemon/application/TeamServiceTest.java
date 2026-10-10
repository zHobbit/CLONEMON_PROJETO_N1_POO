package br.clonemon.application;

import br.clonemon.domain.AiStrategy;
import br.clonemon.domain.Catalog;
import br.clonemon.domain.DamageCalculator;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TeamServiceTest {
    private static final long TRAINER = 1L;
    private static final long OTHER = 2L;

    private final InMemoryPorts.Monsters monsters = new InMemoryPorts.Monsters();
    private final InMemoryPorts.Battles battles = new InMemoryPorts.Battles();
    private final InMemoryPorts.FixtureCatalog catalog = new InMemoryPorts.FixtureCatalog();
    private final TeamService teams = new TeamService(monsters, battles, catalog);

    @Test
    void starterIsLevelFiveInFirstSlot() {
        OwnedMonster starter = teams.chooseStarter(TRAINER, Catalog.LUCIFER.id());
        assertThat(starter.monster().level()).isEqualTo(TeamService.STARTER_LEVEL);
        assertThat(starter.teamSlot()).isZero();
        assertThat(starter.nickname()).isEqualTo("Lucifer");
        assertThat(teams.roster(TRAINER).team()).hasSize(1);
    }

    @Test
    void starterCanOnlyBeChosenOnce() {
        teams.chooseStarter(TRAINER, Catalog.OLAF.id());
        assertThatThrownBy(() -> teams.chooseStarter(TRAINER, Catalog.GROOT.id())).isInstanceOf(ConflictException.class);
    }

    @Test
    void unknownSpeciesIsNotFound() {
        assertThatThrownBy(() -> teams.chooseStarter(TRAINER, 99)).isInstanceOf(NotFoundException.class);
    }

    @Test
    void updateTeamReordersAndMovesTheRestToBox() {
        OwnedMonster a = monsters.add(TRAINER, Catalog.GROOT, 5, 0);
        OwnedMonster b = monsters.add(TRAINER, Catalog.OLAF, 5, 1);
        OwnedMonster c = monsters.add(TRAINER, Catalog.COISO, 5, null);

        TeamService.Roster roster = teams.updateTeam(TRAINER, List.of(c.id(), a.id()));

        assertThat(roster.team()).extracting(OwnedMonster::id).containsExactly(c.id(), a.id());
        assertThat(roster.team()).extracting(OwnedMonster::teamSlot).containsExactly(0, 1);
        assertThat(roster.box()).extracting(OwnedMonster::id).containsExactly(b.id());
    }

    @Test
    void updateTeamValidatesInput() {
        OwnedMonster a = monsters.add(TRAINER, Catalog.GROOT, 5, 0);
        OwnedMonster foreign = monsters.add(OTHER, Catalog.OLAF, 5, 0);

        assertThatThrownBy(() -> teams.updateTeam(TRAINER, List.of())).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> teams.updateTeam(TRAINER, List.of(1L, 2L, 3L, 4L, 5L, 6L, 7L)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> teams.updateTeam(TRAINER, List.of(a.id(), a.id()))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> teams.updateTeam(TRAINER, List.of(foreign.id()))).isInstanceOf(NotFoundException.class);
    }

    @Test
    void healRestoresEveryMonster() {
        OwnedMonster a = monsters.add(TRAINER, Catalog.GROOT, 10, 0);
        a.monster().takeDamage(20);
        a.monster().use(1);
        monsters.save(a);

        OwnedMonster healed = teams.healAll(TRAINER).team().getFirst();

        assertThat(healed.monster().currentHp()).isEqualTo(healed.monster().maxHp());
        assertThat(healed.monster().ppLeft(1)).isEqualTo(10);
    }

    @Test
    void cannotHealOrChangeTeamDuringBattle() {
        OwnedMonster a = monsters.add(TRAINER, Catalog.GROOT, 10, 0);
        new BattleService(battles, monsters, catalog, new InMemoryPorts.Npcs(), new InMemoryPorts.World(),
                new DamageCalculator(new InMemoryPorts.ScriptedRandom()),
                AiStrategy.greedy(), new InMemoryPorts.ScriptedRandom()).start(TRAINER);

        assertThatThrownBy(() -> teams.healAll(TRAINER)).isInstanceOf(ConflictException.class);
        assertThatThrownBy(() -> teams.updateTeam(TRAINER, List.of(a.id()))).isInstanceOf(ConflictException.class);
    }
}
