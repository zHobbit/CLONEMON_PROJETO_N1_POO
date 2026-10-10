-- Mapa do mundo: posicao salva do treinador e treinadores (NPCs) com time fixo, que so podem ser derrotados uma vez.

-- Posicao em ladrilhos; nula ate o treinador salvar a primeira (o frontend usa o ponto de partida do mapa).
alter table trainer
    add column world_x      int check (world_x between 0 and 199),
    add column world_y      int check (world_y between 0 and 199),
    add column world_facing varchar(5) check (world_facing in ('UP', 'DOWN', 'LEFT', 'RIGHT')),
    add constraint trainer_world_position_complete
        check ((world_x is null) = (world_y is null) and (world_x is null) = (world_facing is null));

create table npc_trainer (
    id   varchar(20) primary key,
    name varchar(20) not null
);

-- Time de cada NPC, na ordem em que os monstros entram em campo.
create table npc_team (
    npc_id     varchar(20) not null references npc_trainer (id),
    slot       int         not null check (slot >= 0),
    species_id bigint      not null references species (id),
    level      int         not null check (level between 1 and 50),
    primary key (npc_id, slot)
);

create table trainer_npc_defeat (
    trainer_id  bigint      not null references trainer (id) on delete cascade,
    npc_id      varchar(20) not null references npc_trainer (id),
    defeated_at timestamptz not null default now(),
    primary key (trainer_id, npc_id)
);

-- Nulo = batalha contra clonemon selvagem (inclusive as gravadas antes da V6).
alter table battle add column npc_id varchar(20) references npc_trainer (id);

insert into npc_trainer (id, name) values
    ('caio', 'CAIO'),
    ('bia',  'BIA'),
    ('zeca', 'ZECA');

insert into npc_team (npc_id, slot, species_id, level) values
    ('caio', 0,  2,  5),  -- Coiso
    ('caio', 1, 11,  6),  -- Abacaxi
    ('bia',  0,  9,  7),  -- Pimentinha
    ('bia',  1, 12,  8),  -- Gatonet
    ('zeca', 0,  8,  9),  -- PaoDeAcucar
    ('zeca', 1, 10, 10),  -- Pinguim
    ('zeca', 2,  3, 11);  -- Lucifer
