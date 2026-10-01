package br.clonemon.application;

import br.clonemon.application.port.BattleRepository;
import br.clonemon.application.port.BattleRepository.StoredBattle;
import br.clonemon.application.port.MonsterRepository;
import br.clonemon.application.port.SpeciesCatalog;
import br.clonemon.domain.AiStrategy;
import br.clonemon.domain.Battle;
import br.clonemon.domain.DamageCalculator;
import br.clonemon.domain.ExperienceCurve;
import br.clonemon.domain.Monster;
import br.clonemon.domain.Species;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.random.RandomGenerator;
import java.util.stream.Collectors;

@Service
@Transactional
public class BattleService {

    public record TurnResult(List<String> events, BattleSession session) {}

    private final BattleRepository battles;
    private final MonsterRepository monsters;
    private final SpeciesCatalog catalog;
    private final DamageCalculator calc;
    private final AiStrategy ai;
    private final RandomGenerator rng;

    public BattleService(BattleRepository battles, MonsterRepository monsters, SpeciesCatalog catalog,
                         DamageCalculator calc, AiStrategy ai, RandomGenerator rng) {
        this.battles = battles;
        this.monsters = monsters;
        this.catalog = catalog;
        this.calc = calc;
        this.ai = ai;
        this.rng = rng;
    }

    /** Inicia uma batalha contra um clonemon selvagem de nivel proximo ao do time. */
    public BattleSession start(long trainerId) {
        if (battles.findActiveByTrainer(trainerId).isPresent()) throw new ConflictException("A battle is already in progress");
        List<OwnedMonster> team = TeamService.teamOf(monsters.findByTrainer(trainerId));
        if (team.stream().allMatch(m -> m.monster().isFainted()))
            throw new ConflictException("Your team has no monster able to battle");

        Battle battle = new Battle(team.stream().map(OwnedMonster::monster).toList(), List.of(wildMonster(team)), calc, ai);
        return persist(new BattleSession(null, trainerId, team.stream().map(OwnedMonster::id).toList(), battle));
    }

    @Transactional(readOnly = true)
    public BattleSession get(long trainerId, long battleId) {
        return battles.findById(battleId)
                .filter(b -> b.trainerId() == trainerId)
                .map(this::rehydrate)
                .orElseThrow(() -> new NotFoundException("Battle not found: " + battleId));
    }

    @Transactional(readOnly = true)
    public Optional<BattleSession> active(long trainerId) {
        return battles.findActiveByTrainer(trainerId).map(this::rehydrate);
    }

    /** Executa um turno e salva o progresso dos monstros do jogador. Vencer recruta o clonemon derrotado. */
    public TurnResult submitTurn(long trainerId, long battleId, Battle.Action action) {
        BattleSession session = get(trainerId, battleId);
        if (session.battle().isFinished()) throw new ConflictException("Battle already finished");

        List<String> events = new ArrayList<>(session.battle().submit(action));
        syncPlayerMonsters(session);
        if (session.battle().status() == Battle.Status.PLAYER_WON)
            events.add(recruit(trainerId, session.battle().enemyTeam().getFirst()));
        return new TurnResult(events, persist(session));
    }

    private Monster wildMonster(List<OwnedMonster> team) {
        int top = team.stream().mapToInt(m -> m.monster().level()).max().orElse(1);
        int level = Math.clamp(top - 2 + rng.nextInt(4), 1, ExperienceCurve.MAX_LEVEL);
        List<Species> all = catalog.findAll();
        return new Monster(all.get(rng.nextInt(all.size())), level);
    }

    private void syncPlayerMonsters(BattleSession s) {
        Map<Long, OwnedMonster> owned = monsters.findByTrainer(s.trainerId()).stream()
                .collect(Collectors.toMap(OwnedMonster::id, Function.identity()));
        List<OwnedMonster> updated = new ArrayList<>();
        for (int i = 0; i < s.playerMonsterIds().size(); i++) {
            OwnedMonster o = owned.get(s.playerMonsterIds().get(i));
            if (o != null) updated.add(o.withMonster(s.battle().playerTeam().get(i)));
        }
        monsters.saveAll(updated);
    }

    private String recruit(long trainerId, Monster defeated) {
        Integer slot = TeamService.firstFreeSlot(monsters.findByTrainer(trainerId));
        String name = defeated.species().name();
        monsters.save(new OwnedMonster(null, trainerId, name, slot, new Monster(defeated.species(), defeated.level())));
        return name + (slot != null ? " entrou para o seu time!" : " foi enviado para o PC.");
    }

    private BattleSession rehydrate(StoredBattle s) {
        return new BattleSession(s.id(), s.trainerId(), s.playerMonsterIds(), Battle.restore(s.state(), calc, ai));
    }

    private BattleSession persist(BattleSession s) {
        StoredBattle saved = battles.save(new StoredBattle(s.id(), s.trainerId(), s.playerMonsterIds(), s.battle().state()));
        return new BattleSession(saved.id(), s.trainerId(), s.playerMonsterIds(), s.battle());
    }
}
