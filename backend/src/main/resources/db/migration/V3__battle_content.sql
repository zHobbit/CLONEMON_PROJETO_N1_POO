-- Efeitos secundarios dos golpes e golpes aprendidos por nivel.

-- effect: NONE, um status aplicado no alvo (BURN, FREEZE, PARALYSIS, SLEEP), RAISE (sobe um atributo
-- de quem usa o golpe) ou LOWER (baixa um atributo do alvo). effect_chance e a chance, em %, quando o golpe acerta.
-- Os padroes mantem validos os golpes inseridos sem essas colunas.
alter table move
    add column effect        varchar(10) not null default 'NONE'
        check (effect in ('NONE', 'BURN', 'FREEZE', 'PARALYSIS', 'SLEEP', 'RAISE', 'LOWER')),
    add column effect_chance int not null default 0 check (effect_chance between 0 and 100),
    add column effect_stat   varchar(3) check (effect_stat in ('ATK', 'DEF', 'SPD')),
    add column effect_stages int not null default 0 check (effect_stages between 0 and 6);

alter table move add constraint move_effect_consistency check (
    (effect = 'NONE' and effect_chance = 0 and effect_stat is null and effect_stages = 0)
    or (effect in ('BURN', 'FREEZE', 'PARALYSIS', 'SLEEP') and effect_chance > 0 and effect_stat is null and effect_stages = 0)
    or (effect in ('RAISE', 'LOWER') and effect_chance > 0 and effect_stat is not null and effect_stages > 0)
);

-- Nivel em que a especie aprende o golpe. Os slots seguem a ordem de aprendizado.
alter table species_move add column learn_level int not null default 1 check (learn_level between 1 and 50);

-- Golpes aprendidos subindo de nivel usam ids a partir de 101. Poder 0 = golpe de status.
insert into move (id, name, element, power, accuracy, max_pp, effect, effect_chance, effect_stat, effect_stages) values
    (101, 'Piso molhado',     'AGUA',   0, 100, 20, 'LOWER',     100, 'SPD', 2),
    (102, 'Agua de salsicha', 'AGUA',  80,  90, 10, 'LOWER',      30, 'ATK', 1),
    (103, 'Casca grossa',     'ROCHA',  0, 100, 20, 'RAISE',     100, 'DEF', 2),
    (104, 'Pedra no sapato',  'ROCHA', 80,  90, 10, 'LOWER',      30, 'SPD', 1),
    (105, 'Churrasco grego',  'FOGO',  60, 100, 15, 'BURN',       30, null,  0),
    (106, 'Sangue nos olhos', 'FOGO',   0, 100, 15, 'RAISE',     100, 'ATK', 2),
    (107, 'Frio na barriga',  'GELO',   0, 100, 15, 'LOWER',     100, 'ATK', 2),
    (108, 'Picole de chuchu', 'GELO',  75,  95, 10, 'FREEZE',     15, null,  0),
    (109, 'Urtigada',         'GRAMA', 60, 100, 15, 'LOWER',      30, 'DEF', 1),
    (110, 'Cha de camomila',  'GRAMA',  0,  75, 10, 'SLEEP',     100, null,  0),
    (111, 'Conta de luz',     'RAIO',   0,  90, 15, 'LOWER',     100, 'DEF', 2),
    (112, 'Dedo na tomada',   'RAIO',  80,  95, 10, 'PARALYSIS',  30, null,  0);

-- Cada clonemon original aprende um golpe novo no nivel 7 e outro no 12 (os iniciais comecam no 5).
insert into species_move (species_id, slot, move_id, learn_level) values
    (1, 2, 101, 7), (1, 3, 102, 12),
    (2, 2, 103, 7), (2, 3, 104, 12),
    (3, 2, 105, 7), (3, 3, 106, 12),
    (4, 2, 107, 7), (4, 3, 108, 12),
    (5, 2, 109, 7), (5, 3, 110, 12),
    (6, 2, 111, 7), (6, 3, 112, 12);
