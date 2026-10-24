# Replay de batalhas: design

Data: 2026-10-24. Status: aprovado pelo dono do projeto. Origem: `docs/pesquisa-showdown.md`, item 14.

## Objetivo
Rever qualquer uma das 20 batalhas mais recentes dentro do jogo, turno a turno, com controles de reprodução e a opção de ver a arena pelo lado do oponente.

## Decisões
| Tema | Decisão |
|---|---|
| Quais batalhas | Todas as que terminarem depois da V8. Ficam as **20 mais recentes já terminadas** de cada treinador. |
| Onde assistir | Só dentro do jogo, em **REPLAYS** no menu de pausa. Só o dono vê, sem link público. |
| Ponto de vista | A tecla **V** espelha a arena. Os textos não mudam. |
| Armazenamento | **Log de eventos**: o retrato inicial dos times mais os eventos de cada turno. Nada de semente com nova simulação, que quebraria a cada mudança de regra. |
| Level-up | Cada turno guarda o nível e o HP máximo do time do jogador **depois** do turno. O replay aplica isso no fim do turno, como o jogo ao vivo faz com `sync(res.battle)`. |

## Backend

### Domínio
- `Battle.Event` ganha `enemyActive`, o índice do monstro do oponente em campo depois do evento. A mudança é só aditiva: o cliente ao vivo ignora o campo.

### Gravação (`BattleService`, na mesma transação da batalha)
1. `start` e `challenge` chamam `replays.start(battleId, trainerId, opponent, snapshot)`.
   - `opponent`: `"CAIO"` contra treinador, `"<Especie> selvagem"` contra selvagem.
   - `snapshot`: os times completos dos dois lados no início (`CombatantDto`, sem golpes), `playerActive`, `enemyActive` e `npcName`.
2. `submitTurn` chama `replays.appendTurn(battleId, turn)`, com `turn = { events, playerTeam: [{ level, maxHp }] }`. O time é o do jogador depois do turno. Os eventos são os que a API devolve, inclusive a última mensagem do serviço (recrutou ou derrotou).
3. Quando o status deixa de ser `AWAITING_ACTION` (vitória, derrota ou fuga), chama `replays.finish(battleId, result)`. Em seguida apaga os replays terminados do treinador além dos 20 mais novos.

### Porta e adaptador
`application/port/ReplayRepository`:
- `start(...)`
- `appendTurn(...)`
- `finish(...)`
- `prune(trainerId, keep)`
- `listFinished(trainerId, limit)`
- `findFinished(trainerId, battleId)`

A implementação é `infrastructure/persistence/JpaReplayRepository`, com os JSON em jsonb.

### Migração `V8__battle_replay.sql`
```sql
create table battle_replay (
    battle_id   bigint primary key references battle (id) on delete cascade,
    trainer_id  bigint not null references trainer (id) on delete cascade,
    opponent    varchar(40) not null,
    lead        varchar(20) not null,
    turn_count  int not null default 0,
    result      varchar(12) check (result in ('PLAYER_WON', 'PLAYER_LOST', 'FLED')),
    started_at  timestamptz not null default now(),
    finished_at timestamptz,
    snapshot    jsonb not null,
    turns       jsonb not null default '[]',
    check ((result is null) = (finished_at is null))
);
create index battle_replay_trainer_finished on battle_replay (trainer_id, finished_at desc);
```
Batalhas anteriores à V8 não têm replay.

### API (autenticada; cada treinador só vê os próprios replays)
- `GET /api/replays` devolve até 20 itens, do mais novo para o mais antigo:
  ```json
  [{ "id": 42, "finishedAt": "...", "opponent": "CAIO", "lead": "Lindoya", "result": "PLAYER_WON", "turnCount": 7 }]
  ```
  `lead` é o monstro que começou a batalha.
- `GET /api/replays/{id}` devolve o item da lista mais `snapshot` e `turns`. Responde 404 se o replay não existe, se é de outro treinador ou se a batalha ainda está em andamento.

### Testes
- **`BattleServiceTest`, com uma porta em memória:**
  - o snapshot sai certo para selvagem e para treinador;
  - um turno é gravado por chamada, com `playerTeam` depois de subir de nível;
  - o `result` é gravado em vitória, derrota e fuga;
  - só os 20 mais novos sobrevivem.
- **`PersistenceIntegrationTest`:**
  - o jsonb faz a ida e volta sem perder dados;
  - apagar o treinador apaga os replays (cascade);
  - a limpeza mantém os 20 mais novos;
  - `listFinished` ignora o que está em andamento.
- **`ApiIntegrationTest`:**
  - uma batalha jogada até o fim aparece na lista com todos os turnos;
  - outro treinador recebe 404;
  - a batalha ativa não aparece.

## Frontend

### Refatoração
`BattleStage` sai de dentro do `BattleScene`. Ele reúne:
- os sprites;
- o `InfoBox`;
- as bolinhas do time;
- `play(step)`;
- as animações de troca, entrada do oponente e desmaio;
- o texto flutuante de HP.

O `BattleScene` ao vivo fica com a API, os menus, o histórico e o ritmo. O `ReplayScene` usa o mesmo stage, então as animações são idênticas e não há código copiado. O stage recebe um mapa de lado para posição na tela (`perspective: 'player' | 'enemy'`), e é isso que permite espelhar.

### Entrada
- O menu de pausa do mapa passa a ser `TIME`, `REPLAYS` e `SAIR`.
- A lista mostra uma linha por replay, por exemplo `CAIO       VITORIA 12T 24/10`.
- Os resultados aparecem como VITORIA, DERROTA ou FUGIU. Enter abre o replay e Esc volta ao mapa.

### `ReplayScene`
- Toca sozinho, turno a turno. O texto avança por tempo, sem esperar a seta.
- Teclas:
  - **Enter:** pausa e continua.
  - **→:** próximo turno.
  - **←:** turno anterior.
  - **↑ e ↓:** velocidade 1×, 2× ou 4×.
  - **V:** espelha a arena.
  - **H:** abre o histórico.
  - **Esc:** volta para a lista.
- O rodapé mostra `TURNO 3/12  2x  >`, ou `||` quando pausado.
- **Turno anterior** é um salto instantâneo. A função pura `stateAfter(replay, k)` reconstrói, sem animar, o estado depois de `k` turnos:
  - os monstros ativos;
  - o HP;
  - os status;
  - quem desmaiou;
  - o nível e o HP máximo.
- **Espelho (V):** o monstro do oponente vai para perto, de costas e com os números de HP; o do jogador vai para longe, de frente.
- O histórico (H) usa as `historyLines` do lote B.

### Teclas novas
`V` vira a tecla `view`. As outras já existem.

### Testes
- **Vitest:**
  - `stateAfter` com troca do jogador, monstro seguinte do treinador, desmaio, status e level-up;
  - os rótulos da lista;
  - o ciclo de velocidades;
  - o mapa de lado para posição na tela;
  - a tecla V.
- **Sem regressão:** os E2E de batalha atuais continuam verdes depois da extração do `BattleStage`.
- **E2E com o backend real:**
  1. jogar uma batalha selvagem até o fim;
  2. no mapa, abrir o menu de pausa e entrar em REPLAYS;
  3. abrir o replay e avançar e voltar turnos com → e ←;
  4. espelhar com V;
  5. tirar screenshots.

## Erros e limites
- Se a lista não carrega, aparece `ERRO DE CONEXAO`; Esc volta.
- Se o replay sumiu, por exemplo apagado pela limpeza, aparece `REPLAY NAO ENCONTRADO` e o jogo volta para a lista.
- Lista vazia: `NENHUM REPLAY AINDA`.
- Tamanho: cerca de 1 KB por turno, então no pior caso uns 1 MB por treinador.

## Entrega
1. A branch é `feat/replay`, com commits por camada:
   1. evento do domínio;
   2. V8 e persistência;
   3. serviço e API;
   4. extração do `BattleStage`;
   5. `ReplayScene` e o menu;
   6. documentação.
2. Antes de **cada** commit: revisão do diff mais os testes completos da camada (`./mvnw verify` e/ou `tsc`, Vitest e E2E).
3. PR com auto-merge, sem crédito ao Claude.
4. A documentação atualizada inclui README (REPLAYS e teclas), `docs/architecture.md` (API) e `docs/database.md` (V8 e ERD).

## Fora do escopo
- Link público.
- Replays de batalhas anteriores à V8.
- Exportar para arquivo.
- Comentários ou compartilhamento.
