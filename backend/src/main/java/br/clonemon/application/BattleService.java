package br.clonemon.application;

import br.clonemon.application.port.BattleRepository;
import br.clonemon.application.port.BattleRepository.StoredBattle;
import br.clonemon.application.port.MonsterRepository;
import br.clonemon.application.port.NpcCatalog;
import br.clonemon.application.port.SpeciesCatalog;
import br.clonemon.application.port.WorldRepository;
import br.clonemon.domain.AiStrategy;
import br.clonemon.domain.Battle;
import br.clonemon.domain.DamageCalculator;
import br.clonemon.domain.ExperienceCurve;
import br.clonemon.domain.Monster;
import br.clonemon.domain.NpcTrainer;
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

    public record TurnResult(List<Battle.Event> events, BattleSession session) {}

    /** Treinadores escolhem sempre o golpe com maior dano esperado; selvagens usam a IA injetada. */
    private static final AiStrategy TRAINER_AI = AiStrategy.greedy();

    private final BattleRepository battles;
    private final MonsterRepository monsters;
    private final SpeciesCatalog catalog;
    private final NpcCatalog npcs;
    private final WorldRepository world;
    private final DamageCalculator calc;
    private final AiStrategy ai;
    private final RandomGenerator rng;

    public BattleService(BattleRepository battles, MonsterRepository monsters, SpeciesCatalog catalog, NpcCatalog npcs,
                         WorldRepository world, DamageCalculator calc, AiStrategy ai, RandomGenerator rng) {
        this.battles = battles;
        this.monsters = monsters;
        this.catalog = catalog;
        this.npcs = npcs;
        this.world = world;
        this.calc = calc;
        this.ai = ai;
        this.rng = rng;
    }

    /** Inicia uma batalha contra um clonemon selvagem de nivel proximo ao do time. */
    public BattleSession start(long trainerId) {
        List<OwnedMonster> team = readyTeam(trainerId);
        Battle battle = new Battle(team.stream().map(OwnedMonster::monster).toList(), List.of(wildMonster(team)), calc, ai);
        return persist(new BattleSession(null, trainerId, null, team.stream().map(OwnedMonster::id).toList(), battle));
    }

    /** Desafia um treinador do mapa. Cada um so pode ser derrotado uma vez. */
    public BattleSession challenge(long trainerId, String npcId) {
        NpcTrainer npc = npcs.findById(npcId).orElseThrow(() -> new NotFoundException("NPC not found: " + npcId));
        if (world.hasDefeated(trainerId, npc.id())) throw new ConflictException("NPC already defeated: " + npc.id());
        List<OwnedMonster> team = readyTeam(trainerId);
        Battle battle = new Battle(team.stream().map(OwnedMonster::monster).toList(), npc.freshTeam(), npc.name(), calc, TRAINER_AI);
        return persist(new BattleSession(null, trainerId, npc.id(), team.stream().map(OwnedMonster::id).toList(), battle));
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

    /**
     * Executa um turno e salva o progresso dos monstros do jogador. Vencer um selvagem recruta o clonemon derrotado;
     * vencer um treinador registra a vitoria sobre ele.
     */
    public TurnResult submitTurn(long trainerId, long battleId, Battle.Action action) {
        BattleSession session = get(trainerId, battleId);
        if (session.battle().isFinished()) throw new ConflictException("Battle already finished");

        List<Battle.Event> events = new ArrayList<>(session.battle().submit(action));
        syncPlayerMonsters(session);
        if (session.battle().status() == Battle.Status.PLAYER_WON)
            events.add(session.battle().narrate(session.npcId() == null
                    ? recruit(trainerId, session.battle().enemyTeam().getFirst())
                    : recordDefeat(session)));
        return new TurnResult(events, persist(session));
    }

    private List<OwnedMonster> readyTeam(long trainerId) {
        if (battles.findActiveByTrainer(trainerId).isPresent()) throw new ConflictException("A battle is already in progress");
        List<OwnedMonster> team = TeamService.teamOf(monsters.findByTrainer(trainerId));
        if (team.stream().allMatch(m -> m.monster().isFainted()))
            throw new ConflictException("Your team has no monster able to battle");
        return team;
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

    private String recordDefeat(BattleSession s) {
        world.recordDefeat(s.trainerId(), s.npcId());
        return "Voce derrotou " + s.battle().opponentName() + "!";
    }

    private BattleSession rehydrate(StoredBattle s) {
        Battle battle = s.npcId() == null
                ? Battle.restore(s.state(), calc, ai)
                : Battle.restore(s.state(), npc(s.npcId()).name(), calc, TRAINER_AI);
        return new BattleSession(s.id(), s.trainerId(), s.npcId(), s.playerMonsterIds(), battle);
    }

    private NpcTrainer npc(String id) {
        return npcs.findById(id).orElseThrow(() -> new IllegalStateException("Battle against unknown NPC: " + id));
    }

    private BattleSession persist(BattleSession s) {
        StoredBattle saved = battles.save(new StoredBattle(s.id(), s.trainerId(), s.npcId(), s.playerMonsterIds(), s.battle().state()));
        return new BattleSession(saved.id(), s.trainerId(), s.npcId(), s.playerMonsterIds(), s.battle());
    }
}
