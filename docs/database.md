# Banco de dados

PostgreSQL, com o schema versionado pelo Flyway em
[`backend/src/main/resources/db/migration`](../backend/src/main/resources/db/migration):

- `V1__schema.sql`: tabelas, chaves e restrições.
- `V2__seed.sql`: os 6 clonemons e os 12 golpes do jogo original.
- `V3__battle_content.sql`: efeitos secundários dos golpes, nível de aprendizado em `species_move`
  e 12 golpes novos (ids 101 a 112), dois por clonemon original, aprendidos nos níveis 7 e 12.

O Hibernate roda com `ddl-auto=validate`: ele só confere se as entidades batem com o schema, nunca o altera.

## Diagrama

```mermaid
erDiagram
    TRAINER ||--o{ MONSTER : possui
    TRAINER ||--o{ BATTLE : joga
    SPECIES ||--o{ MONSTER : "e da especie"
    SPECIES ||--|{ SPECIES_MOVE : aprende
    MOVE ||--o{ SPECIES_MOVE : "e aprendido por"
    MONSTER ||--|{ MONSTER_MOVE_PP : "tem PP de"

    TRAINER {
        bigint id PK
        varchar username UK "3 a 20, minusculo"
        varchar password_hash "bcrypt"
        timestamptz created_at
    }
    SPECIES {
        bigint id PK
        varchar name UK
        varchar element "AGUA ROCHA FOGO GELO GRAMA RAIO"
        int base_hp
        int base_atk
        int base_def
        int base_spd
    }
    MOVE {
        bigint id PK
        varchar name UK
        varchar element
        int power
        int accuracy "1 a 100"
        int max_pp
        varchar effect "NONE BURN FREEZE PARALYSIS SLEEP RAISE LOWER"
        int effect_chance "0 a 100, em %"
        varchar effect_stat "ATK DEF SPD; so RAISE e LOWER"
        int effect_stages "0 a 6; so RAISE e LOWER"
    }
    SPECIES_MOVE {
        bigint species_id PK, FK
        int slot PK "ordem no menu e de aprendizado"
        bigint move_id FK
        int learn_level "padrao 1"
    }
    MONSTER {
        bigint id PK
        bigint trainer_id FK
        bigint species_id FK
        varchar nickname
        int xp "o nivel vem do XP"
        int current_hp
        int team_slot "0 a 5; nulo = no PC"
    }
    MONSTER_MOVE_PP {
        bigint monster_id PK, FK
        int slot PK
        int pp_left
    }
    BATTLE {
        bigint id PK
        bigint trainer_id FK
        varchar status "AWAITING_ACTION PLAYER_WON PLAYER_LOST FLED"
        jsonb state "estado completo da batalha"
        int version "bloqueio otimista"
        timestamptz created_at
    }
```

## Decisões

| Decisão | Motivo |
|---|---|
| O nível não é uma coluna | É calculado a partir do XP (`ExperienceCurve`), então não tem como ficar inconsistente. |
| PP por golpe em `monster_move_pp` | Cada monstro gasta PP de forma independente; o `slot` liga o PP ao golpe da espécie. |
| `unique (trainer_id, team_slot)` adiável | Reorganizar o time troca slots dentro de uma transação. A verificação acontece só no commit. |
| Índice único parcial `battle_one_active_per_trainer` | Garante no banco no máximo uma batalha em andamento por treinador, mesmo com requisições simultâneas. |
| Estado da batalha em `jsonb` | O estado (os dois times, monstro ativo, log) é lido e gravado inteiro a cada turno; não é consultado por partes. |
| `version` na batalha | Dois turnos enviados ao mesmo tempo para a mesma batalha geram 409 em vez de corromper o estado. |
| Espécies em memória | `species`, `move` e `species_move` são dados fixos, carregados uma vez por `JpaSpeciesCatalog`. |
| Slots em ordem de aprendizado | Os golpes conhecidos num nível são sempre os primeiros slots, então `monster_move_pp` só cresce no fim quando o monstro aprende um golpe. Saves de antes da V3 têm menos linhas de PP: ao carregar, os golpes que faltam vêm com PP cheio. |
| Efeito do golpe em colunas com padrão | `effect = 'NONE'` e `learn_level = 1` por padrão, então inserts que não citam as colunas novas continuam válidos. A restrição `move_effect_consistency` impede combinações sem sentido (status com atributo, RAISE sem estágios...). |
| Status e estágios só no `jsonb` | Valem apenas durante a batalha: ficam no `state` (`status`, `sleepTurns`, `stages` de cada monstro) e somem quando ela termina. Batalhas salvas sem esses campos carregam sem status e com estágios zerados. |

## Fluxo de um turno

1. A API carrega a batalha (`jsonb`) e reconstrói o domínio (`Battle.restore`).
2. O domínio resolve o turno e devolve os eventos.
3. HP, XP e PP dos monstros do jogador são gravados em `monster` e `monster_move_pp`, então o progresso fica salvo a cada turno.
4. Se o jogador vencer, o clonemon derrotado entra para o time (ou vai para o PC).
5. A batalha é gravada de volta, com checagem da `version`.
