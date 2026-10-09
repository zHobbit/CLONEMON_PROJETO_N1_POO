-- 6 clonemons novos, um por elemento, com 2 golpes cada (ids de golpe a partir de 101).
insert into move (id, name, element, power, accuracy, max_pp) values
    (101, 'Esguicho',            'AGUA',  40, 100, 25),
    (102, 'Pororoca',            'AGUA',  90,  85, 10),
    (103, 'Pedra no sapato',     'ROCHA', 40, 100, 25),
    (104, 'Bondinho',            'ROCHA', 90,  85, 10),
    (105, 'Ardidinha',           'FOGO',  40, 100, 25),
    (106, 'Pimenta nos olhos',   'FOGO',  90,  85, 10),
    (107, 'Ima de geladeira',    'GELO',  40, 100, 25),
    (108, 'Fecha a geladeira',   'GELO',  90,  85, 10),
    (109, 'Casca grossa',        'GRAMA', 40, 100, 25),
    (110, 'Descascar o abacaxi', 'GRAMA', 90,  85, 10),
    (111, 'Gambiarra',           'RAIO',  40, 100, 25),
    (112, 'Apagao',              'RAIO',  90,  85, 10);

insert into species (id, name, element, base_hp, base_atk, base_def, base_spd) values
    (7,  'Boto',        'AGUA',  46, 52, 45, 70),
    (8,  'PaoDeAcucar', 'ROCHA', 60, 50, 80, 22),
    (9,  'Pimentinha',  'FOGO',  32, 70, 35, 72),
    (10, 'Pinguim',     'GELO',  52, 48, 68, 38),
    (11, 'Abacaxi',     'GRAMA', 52, 58, 62, 35),
    (12, 'Gatonet',     'RAIO',  40, 60, 38, 80);

insert into species_move (species_id, slot, move_id) values
    (7,  0, 101), (7,  1, 102),
    (8,  0, 103), (8,  1, 104),
    (9,  0, 105), (9,  1, 106),
    (10, 0, 107), (10, 1, 108),
    (11, 0, 109), (11, 1, 110),
    (12, 0, 111), (12, 1, 112);
