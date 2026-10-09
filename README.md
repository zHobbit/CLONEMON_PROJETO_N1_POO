# CLONEMON

> O melhor pior clone de Pokémon que você já viu, agora em pixel art.

Batalhas por turno contra clonemons selvagens, time de até 6, XP e níveis, progresso salvo no servidor.
Reescrita completa do [projeto de POO original](https://github.com/zHobbit/CLONEMON_PROJETO_N1_POO):
Spring Boot + PostgreSQL no backend e Phaser no navegador.

| | |
|---|---|
| ![Tela de título](docs/screenshots/titulo.png) | ![Escolha do inicial](docs/screenshots/inicial.png) |
| ![Batalha](docs/screenshots/batalha.png) | ![Menu do time](docs/screenshots/menu.png) |

## Os clonemons

| Clonemon | Tipo | Golpes |
|---|---|---|
| Lindoya | ÁGUA | Cuspe, Vap de alta pressão |
| Coiso | ROCHA | Pedrada, Meteoro |
| Lucifer | FOGO | Molotov, Fogo na Babilônia |
| Olaf | GELO | Cubo de gelo, Fica frio aí |
| Groot | GRAMA | Corte de papel A4, Cartolinada |
| EletroPaulo | RAIO | Volt, Bivolt |

Os tipos funcionam em ciclo: cada um causa o dobro de dano no seguinte e metade no anterior.

```
ÁGUA → ROCHA → FOGO → GELO → GRAMA → RAIO → ÁGUA
```

## Como jogar

1. Crie um treinador e escolha seu primeiro clonemon.
2. Em **LUTAR** você enfrenta um clonemon selvagem de nível parecido com o do seu time.
3. Vencer dá XP e o clonemon derrotado entra para o seu time (ou vai para o PC, se o time estiver cheio).
4. Em **TIME** você organiza a ordem e troca monstros entre o time e o PC. Em **CURAR** o time recupera HP e PP.

O progresso é salvo a cada turno: dá para fechar o navegador no meio de uma batalha e continuar depois.

**Controles:** setas navegam, Enter / Espaço / Z confirmam, Esc / Backspace / X voltam. O mouse também funciona.

## Rodando localmente

Requisitos: Java 21+, Node 22+ e Docker.

### Jeito rápido (banco temporário)

O backend sobe um Postgres descartável sozinho, via Testcontainers. Os dados somem quando ele para.

```bash
cd backend && ./mvnw spring-boot:test-run -Dspring-boot.run.main-class=br.clonemon.TestClonemonApplication
```

```bash
cd frontend && npm install && npm run dev
```

Abra http://localhost:5173.

### Com banco persistente

```bash
docker compose up -d
```

```bash
cd backend && ./mvnw spring-boot:run
```

Depois, o frontend como acima.

| Serviço | Porta | Variável |
|---|---|---|
| Frontend (Vite) | 5173 | — |
| API | 8081 | `PORT` |
| PostgreSQL (compose) | 5433 | `DB_URL`, `DB_USER`, `DB_PASSWORD` |

Em produção, defina `JWT_SECRET` (pelo menos 32 bytes).

### Igual à produção (Docker)

A mesma imagem do deploy, com jogo e API juntos em http://localhost:8081:

```bash
docker compose --profile app up -d --build
```

Para publicar na internet, veja [docs/deploy.md](docs/deploy.md).

## Testes

```bash
cd backend && ./mvnw verify
```

```bash
cd frontend && npm run typecheck && npm test
```

```bash
cd frontend && npm run test:e2e
```

- `verify` roda os testes de domínio, de casos de uso, de persistência e da API (precisa do Docker) e gera a cobertura em `backend/target/site/jacoco/index.html`.
- `test:e2e` joga uma partida inteira no navegador e sobe o backend sozinho (precisa do Docker). No Windows usa o Edge instalado.
- `npm run art:preview` salva um print de toda a pixel art em `frontend/test-results/screens/art-gallery.png`.

## Documentação

- [Arquitetura, API e testes](docs/architecture.md)
- [Banco de dados e diagrama ER](docs/database.md)
- [Deploy (Render + Neon)](docs/deploy.md)

## Stack

| Parte | Tecnologias |
|---|---|
| Backend | Java 21, Spring Boot 4 (Web MVC, Data JPA, Security com JWT), Flyway, PostgreSQL |
| Frontend | TypeScript, Vite, Phaser 4, fonte Press Start 2P |
| Arte | Pixel art gerada em código, paleta ENDESGA 32 |
| Testes | JUnit 5, AssertJ, Testcontainers, MockMvc, Vitest, Playwright |

## Créditos

Projeto original de POO (UAM, Ciência da Computação), sob orientação do Prof. André Santana:

- Victor Holanda de Oliveira
- Lucas Sousa Ferreira dos Santos
- Gabriel Alves Memoli

A versão original, de console, continua em [`legacy/`](legacy/) para comparação.
