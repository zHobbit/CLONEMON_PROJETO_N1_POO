package br.clonemon.application;

import br.clonemon.application.port.BattleRepository;
import br.clonemon.application.port.MonsterRepository;
import br.clonemon.application.port.SpeciesCatalog;
import br.clonemon.domain.Monster;
import br.clonemon.domain.Species;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static br.clonemon.application.OwnedMonster.TEAM_SIZE;

@Service
@Transactional
public class TeamService {
    public static final int STARTER_LEVEL = 5;

    /** Time (ordenado por slot) e PC. */
    public record Roster(List<OwnedMonster> team, List<OwnedMonster> box) {}

    private final MonsterRepository monsters;
    private final BattleRepository battles;
    private final SpeciesCatalog catalog;

    public TeamService(MonsterRepository monsters, BattleRepository battles, SpeciesCatalog catalog) {
        this.monsters = monsters;
        this.battles = battles;
        this.catalog = catalog;
    }

    @Transactional(readOnly = true)
    public Roster roster(long trainerId) {
        return split(monsters.findByTrainer(trainerId));
    }

    public OwnedMonster chooseStarter(long trainerId, long speciesId) {
        if (!monsters.findByTrainer(trainerId).isEmpty()) throw new ConflictException("Starter already chosen");
        Species species = catalog.findById(speciesId).orElseThrow(() -> new NotFoundException("Species not found: " + speciesId));
        return monsters.save(new OwnedMonster(null, trainerId, species.name(), 0, new Monster(species, STARTER_LEVEL)));
    }

    /** Define o time na ordem dada; os demais monstros vao para o PC. */
    public Roster updateTeam(long trainerId, List<Long> monsterIds) {
        if (monsterIds.isEmpty() || monsterIds.size() > TEAM_SIZE)
            throw new IllegalArgumentException("Team must have between 1 and " + TEAM_SIZE + " monsters");
        if (new HashSet<>(monsterIds).size() != monsterIds.size())
            throw new IllegalArgumentException("Duplicate monster in team");
        requireNoActiveBattle(trainerId, "Cannot change team during a battle");

        List<OwnedMonster> all = monsters.findByTrainer(trainerId);
        Set<Long> owned = all.stream().map(OwnedMonster::id).collect(Collectors.toSet());
        monsterIds.stream().filter(id -> !owned.contains(id)).findFirst().ifPresent(id -> {
            throw new NotFoundException("Monster not found: " + id);
        });

        List<OwnedMonster> updated = all.stream().map(m -> {
            int idx = monsterIds.indexOf(m.id());
            return m.withTeamSlot(idx >= 0 ? idx : null);
        }).toList();
        return split(monsters.saveAll(updated));
    }

    /** Centro Clonemon: restaura HP e PP de todos os monstros. */
    public Roster healAll(long trainerId) {
        requireNoActiveBattle(trainerId, "Cannot heal during a battle");
        List<OwnedMonster> all = monsters.findByTrainer(trainerId);
        all.forEach(m -> m.monster().fullRestore());
        return split(monsters.saveAll(all));
    }

    static List<OwnedMonster> teamOf(List<OwnedMonster> all) {
        return all.stream().filter(OwnedMonster::inTeam).sorted(Comparator.comparing(OwnedMonster::teamSlot)).toList();
    }

    /** @return primeiro slot livre do time, ou {@code null} se o time estiver cheio */
    static Integer firstFreeSlot(List<OwnedMonster> all) {
        Set<Integer> used = all.stream().filter(OwnedMonster::inTeam).map(OwnedMonster::teamSlot).collect(Collectors.toSet());
        return IntStream.range(0, TEAM_SIZE).filter(i -> !used.contains(i)).boxed().findFirst().orElse(null);
    }

    private void requireNoActiveBattle(long trainerId, String message) {
        if (battles.findActiveByTrainer(trainerId).isPresent()) throw new ConflictException(message);
    }

    private static Roster split(List<OwnedMonster> all) {
        return new Roster(teamOf(all), all.stream().filter(m -> !m.inTeam()).toList());
    }
}
