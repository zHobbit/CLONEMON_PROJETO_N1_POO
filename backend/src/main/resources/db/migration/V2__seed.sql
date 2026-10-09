-- Os 6 clonemons e 12 golpes do CLONEMON original.
insert into move (id, name, element, power, accuracy, max_pp) values
    (1,  'Cuspe',               'AGUA',  40, 100, 25),
    (2,  'Vap de alta pressao', 'AGUA',  90,  85, 10),
    (3,  'Pedrada',             'ROCHA', 40, 100, 25),
    (4,  'Meteoro',             'ROCHA', 90,  85, 10),
    (5,  'Molotov',             'FOGO',  40, 100, 25),
    (6,  'Fogo na Babilonia',   'FOGO',  90,  85, 10),
    (7,  'Cubo de gelo',        'GELO',  40, 100, 25),
    (8,  'Fica frio ai',        'GELO',  90,  85, 10),
    (9,  'Corte de papel A4',   'GRAMA', 40, 100, 25),
    (10, 'Cartolinada',         'GRAMA', 90,  85, 10),
    (11, 'Volt',                'RAIO',  40, 100, 25),
    (12, 'Bivolt',              'RAIO',  90,  85, 10);

insert into species (id, name, element, base_hp, base_atk, base_def, base_spd) values
    (1, 'Lindoya',     'AGUA',  44, 48, 65, 43),
    (2, 'Coiso',       'ROCHA', 50, 55, 75, 30),
    (3, 'Lucifer',     'FOGO',  39, 62, 43, 65),
    (4, 'Olaf',        'GELO',  48, 50, 55, 50),
    (5, 'Groot',       'GRAMA', 55, 49, 60, 40),
    (6, 'EletroPaulo', 'RAIO',  35, 55, 40, 90);

insert into species_move (species_id, slot, move_id) values
    (1, 0, 1),  (1, 1, 2),
    (2, 0, 3),  (2, 1, 4),
    (3, 0, 5),  (3, 1, 6),
    (4, 0, 7),  (4, 1, 8),
    (5, 0, 9),  (5, 1, 10),
    (6, 0, 11), (6, 1, 12);
