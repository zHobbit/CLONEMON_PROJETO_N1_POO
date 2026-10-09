-- 6 clonemons novos, um por elemento, com 2 golpes cada.
-- Golpes com ids a partir de 201, para nao colidir com os golpes aprendidos por nivel (101 em diante).
insert into move (id, name, element, power, accuracy, max_pp) values
    (201, 'Esguicho',            'AGUA',  40, 100, 25),
    (202, 'Pororoca',            'AGUA',  90,  85, 10),
    (203, 'Pedra portuguesa',    'ROCHA', 40, 100, 25),
    (204, 'Bondinho',            'ROCHA', 90,  85, 10),
    (205, 'Ardidinha',           'FOGO',  40, 100, 25),
    (206, 'Pimenta nos olhos',   'FOGO',  90,  85, 10),
    (207, 'Ima de geladeira',    'GELO',  40, 100, 25),
    (208, 'Fecha a geladeira',   'GELO',  90,  85, 10),
    (209, 'Coroada',             'GRAMA', 40, 100, 25),
    (210, 'Descascar o abacaxi', 'GRAMA', 90,  85, 10),
    (211, 'Gambiarra',           'RAIO',  40, 100, 25),
    (212, 'Apagao',              'RAIO',  90,  85, 10);

insert into species (id, name, element, base_hp, base_atk, base_def, base_spd) values
    (7,  'Boto',        'AGUA',  46, 52, 45, 70),
    (8,  'PaoDeAcucar', 'ROCHA', 60, 50, 80, 22),
    (9,  'Pimentinha',  'FOGO',  32, 70, 35, 72),
    (10, 'Pinguim',     'GELO',  52, 48, 68, 38),
    (11, 'Abacaxi',     'GRAMA', 52, 58, 62, 35),
    (12, 'Gatonet',     'RAIO',  40, 60, 38, 80);

insert into species_move (species_id, slot, move_id) values
    (7,  0, 201), (7,  1, 202),
    (8,  0, 203), (8,  1, 204),
    (9,  0, 205), (9,  1, 206),
    (10, 0, 207), (10, 1, 208),
    (11, 0, 209), (11, 1, 210),
    (12, 0, 211), (12, 1, 212);
