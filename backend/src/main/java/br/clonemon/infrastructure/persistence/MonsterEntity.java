package br.clonemon.infrastructure.persistence;

import br.clonemon.application.OwnedMonster;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "monster")
class MonsterEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trainer_id", nullable = false)
    private long trainerId;

    @Column(name = "species_id", nullable = false)
    private long speciesId;

    @Column(nullable = false, length = 40)
    private String nickname;

    private int xp;

    @Column(name = "current_hp")
    private int currentHp;

    @Column(name = "team_slot")
    private Integer teamSlot;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "monster_move_pp", joinColumns = @JoinColumn(name = "monster_id"))
    @OrderColumn(name = "slot")
    @Column(name = "pp_left")
    private List<Integer> pp = new ArrayList<>();

    protected MonsterEntity() {}

    Long getId() { return id; }
    long getTrainerId() { return trainerId; }
    long getSpeciesId() { return speciesId; }
    String getNickname() { return nickname; }
    int getXp() { return xp; }
    int getCurrentHp() { return currentHp; }
    Integer getTeamSlot() { return teamSlot; }

    int[] getPp() { return pp.stream().mapToInt(Integer::intValue).toArray(); }

    static MonsterEntity create() { return new MonsterEntity(); }

    void apply(OwnedMonster m) {
        trainerId = m.trainerId();
        speciesId = m.monster().species().id();
        nickname = m.nickname();
        xp = m.monster().xp();
        currentHp = m.monster().currentHp();
        teamSlot = m.teamSlot();
        int[] values = m.monster().ppSnapshot();
        // Atualiza a colecao no lugar para o Hibernate gerar UPDATEs em vez de apagar e reinserir.
        if (pp.size() != values.length) {
            pp.clear();
            for (int v : values) pp.add(v);
        } else {
            for (int i = 0; i < values.length; i++) pp.set(i, values[i]);
        }
    }
}
