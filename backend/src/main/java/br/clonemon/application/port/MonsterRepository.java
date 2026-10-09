package br.clonemon.application.port;

import br.clonemon.application.OwnedMonster;

import java.util.List;

public interface MonsterRepository {
    /** Todos os monstros do treinador, ordenados pelo id. */
    List<OwnedMonster> findByTrainer(long trainerId);

    OwnedMonster save(OwnedMonster monster);

    List<OwnedMonster> saveAll(List<OwnedMonster> monsters);
}
