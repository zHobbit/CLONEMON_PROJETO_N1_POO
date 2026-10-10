-- Os 6 clonemons do V4 ganham 2 golpes cada, aprendidos nos niveis 7 e 12, como os originais (V3).
-- Ids a partir de 213, depois dos golpes do V4. Poder 0 = golpe de status.
insert into move (id, name, element, power, accuracy, max_pp, effect, effect_chance, effect_stat, effect_stages) values
    (213, 'Papo de boto',     'AGUA',   0, 100, 15, 'LOWER',     100, 'DEF', 2),
    (214, 'Rodamoinho',       'AGUA',  80,  90, 10, 'LOWER',      30, 'SPD', 1),
    (215, 'Cobertura extra',  'ROCHA',  0, 100, 20, 'RAISE',     100, 'DEF', 2),
    (216, 'Morro abaixo',     'ROCHA', 85,  90, 10, 'LOWER',      30, 'DEF', 1),
    (217, 'Molho de pimenta', 'FOGO',  60, 100, 15, 'BURN',       30, null,  0),
    (218, 'Malagueta',        'FOGO',  85,  90, 10, 'BURN',       30, null,  0),
    (219, 'Escorregao',       'GELO',   0, 100, 15, 'LOWER',     100, 'SPD', 2),
    (220, 'Congelador',       'GELO',  75,  95, 10, 'FREEZE',     20, null,  0),
    (221, 'Folha da coroa',   'GRAMA', 60, 100, 15, 'LOWER',      30, 'DEF', 1),
    (222, 'Sono pos almoco',  'GRAMA',  0,  75, 10, 'SLEEP',     100, null,  0),
    (223, 'Fio desencapado',  'RAIO',  60, 100, 15, 'PARALYSIS',  30, null,  0),
    (224, 'Sete vidas',       'RAIO',   0, 100, 10, 'RAISE',     100, 'DEF', 2);

insert into species_move (species_id, slot, move_id, learn_level) values
    (7,  2, 213, 7), (7,  3, 214, 12),
    (8,  2, 215, 7), (8,  3, 216, 12),
    (9,  2, 217, 7), (9,  3, 218, 12),
    (10, 2, 219, 7), (10, 3, 220, 12),
    (11, 2, 221, 7), (11, 3, 222, 12),
    (12, 2, 223, 7), (12, 3, 224, 12);
