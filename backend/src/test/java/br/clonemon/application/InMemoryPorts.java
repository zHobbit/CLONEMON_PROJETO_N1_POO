package br.clonemon.application;

import br.clonemon.application.port.BattleRepository;
import br.clonemon.application.port.MonsterRepository;
import br.clonemon.application.port.SpeciesCatalog;
import br.clonemon.application.port.TrainerRepository;
import br.clonemon.domain.Battle;
import br.clonemon.domain.Catalog;
import br.clonemon.domain.Monster;
import br.clonemon.domain.Species;
import br.clonemon.domain.Trainer;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.random.RandomGenerator;

/** Implementacoes em memoria das portas. Copiam os monstros ao salvar/ler, como o banco faria. */
final class InMemoryPorts {
    private InMemoryPorts() {}

    static Monster copy(Monster m) {
        return Monster.restore(m.species(), m.xp(), m.currentHp(), m.ppSnapshot());
    }

    static final class FixtureCatalog implements SpeciesCatalog {
        @Override public List<Species> findAll() { return Catalog.ALL; }

        @Override public Optional<Species> findById(long id) {
            return Catalog.ALL.stream().filter(s -> s.id() == id).findFirst();
        }
    }

    static final class Trainers implements TrainerRepository {
        private final Map<Long, Trainer> data = new TreeMap<>();
        private long seq;

        @Override public Trainer save(Trainer t) {
            Trainer saved = new Trainer(t.id() != null ? t.id() : ++seq, t.username(), t.passwordHash());
            data.put(saved.id(), saved);
            return saved;
        }

        @Override public Optional<Trainer> findByUsername(String username) {
            return data.values().stream().filter(t -> t.username().equals(username)).findFirst();
        }

        @Override public boolean existsByUsername(String username) { return findByUsername(username).isPresent(); }
    }

    static final class Monsters implements MonsterRepository {
        private final Map<Long, OwnedMonster> data = new TreeMap<>();
        private long seq;

        @Override public List<OwnedMonster> findByTrainer(long trainerId) {
            return data.values().stream().filter(m -> m.trainerId() == trainerId).map(m -> m.withMonster(copy(m.monster()))).toList();
        }

        @Override public OwnedMonster save(OwnedMonster m) {
            long id = m.id() != null ? m.id() : ++seq;
            OwnedMonster stored = new OwnedMonster(id, m.trainerId(), m.nickname(), m.teamSlot(), copy(m.monster()));
            data.put(id, stored);
            return stored.withMonster(copy(stored.monster()));
        }

        @Override public List<OwnedMonster> saveAll(List<OwnedMonster> monsters) {
            return monsters.stream().map(this::save).toList();
        }

        OwnedMonster add(long trainerId, Species s, int level, Integer slot) {
            return save(new OwnedMonster(null, trainerId, s.name(), slot, new Monster(s, level)));
        }
    }

    static final class Battles implements BattleRepository {
        private final Map<Long, StoredBattle> data = new TreeMap<>();
        private long seq;

        @Override public StoredBattle save(StoredBattle b) {
            long id = b.id() != null ? b.id() : ++seq;
            StoredBattle stored = new StoredBattle(id, b.trainerId(), b.playerMonsterIds(), copy(b.state()));
            data.put(id, stored);
            return stored;
        }

        @Override public Optional<StoredBattle> findById(long id) {
            return Optional.ofNullable(data.get(id)).map(b -> new StoredBattle(b.id(), b.trainerId(), b.playerMonsterIds(), copy(b.state())));
        }

        @Override public Optional<StoredBattle> findActiveByTrainer(long trainerId) {
            return data.values().stream()
                    .filter(b -> b.trainerId() == trainerId && b.state().status() == Battle.Status.AWAITING_ACTION)
                    .findFirst().flatMap(b -> findById(b.id()));
        }

        private static Battle.State copy(Battle.State s) {
            return new Battle.State(s.playerTeam().stream().map(InMemoryPorts::copy).toList(),
                    s.enemyTeam().stream().map(InMemoryPorts::copy).toList(),
                    s.playerActive(), s.enemyActive(), s.status(), s.log());
        }
    }

    /** Devolve os valores enfileirados em {@code nextInt(bound)} e depois 0; {@code nextLong} sempre 0. */
    static final class ScriptedRandom implements RandomGenerator {
        private final Deque<Integer> values = new ArrayDeque<>();

        ScriptedRandom(Integer... values) { this.values.addAll(List.of(values)); }

        @Override public long nextLong() { return 0; }

        @Override public int nextInt(int bound) {
            Integer v = values.poll();
            return v == null ? 0 : Math.min(v, bound - 1);
        }
    }
}
