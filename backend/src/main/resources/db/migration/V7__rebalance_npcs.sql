-- Rebalanceamento dos treinadores do mapa medido pelo BalanceTest (200 batalhas por inicial, com a rolagem de dano
-- de 85% a 100% e o empate de velocidade sorteado). Todo inicial vence CAIO em 81% ou mais e BIA e ZECA em 41% ou mais.
update npc_team set species_id = 7,  level = 1 where npc_id = 'caio' and slot = 0;  -- Boto
update npc_team set species_id = 9,  level = 1 where npc_id = 'caio' and slot = 1;  -- Pimentinha
update npc_team set species_id = 10, level = 5 where npc_id = 'bia'  and slot = 0;  -- Pinguim (Abacaxi 7 continua)
update npc_team set                  level = 7 where npc_id = 'zeca' and slot = 0;  -- PaoDeAcucar
