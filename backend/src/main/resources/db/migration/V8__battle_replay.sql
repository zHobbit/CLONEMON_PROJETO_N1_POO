-- Replays: retrato inicial dos times e os eventos de cada turno de toda batalha iniciada a partir daqui.
-- Ficam os 20 terminados mais novos de cada treinador (a limpeza e feita pelo BattleService).
create table battle_replay (
    battle_id   bigint primary key references battle (id) on delete cascade,
    trainer_id  bigint not null references trainer (id) on delete cascade,
    opponent    varchar(40) not null,
    lead        varchar(20) not null,
    turn_count  int not null default 0 check (turn_count >= 0),
    result      varchar(12) check (result in ('PLAYER_WON', 'PLAYER_LOST', 'FLED')),
    started_at  timestamptz not null default now(),
    finished_at timestamptz,
    snapshot    jsonb not null,
    turns       jsonb not null default '[]',
    check ((result is null) = (finished_at is null))
);

create index battle_replay_trainer_finished on battle_replay (trainer_id, finished_at desc);
