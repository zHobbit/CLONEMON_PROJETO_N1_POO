# Deploy

O jogo e a API rodam juntos numa única imagem Docker: o [`Dockerfile`](../Dockerfile) compila o frontend
e o coloca dentro do Spring Boot. O plano usa serviços gratuitos que não expiram:

| Peça | Serviço | Plano gratuito |
|---|---|---|
| Jogo + API | [Render](https://render.com) (web service Docker) | 512 MB, dorme após 15 min sem uso; a primeira visita depois disso leva cerca de 1 minuto |
| Banco | [Neon](https://neon.com) (PostgreSQL) | 1 GB por projeto, 100 horas de computação por mês, desliga após 5 min sem uso |

Os limites mudam com o tempo; confira nas páginas de preço antes de depender deles.

## 1. Banco no Neon

1. Crie uma conta em https://neon.com e um projeto chamado `clonemon`.
2. Escolha a região **AWS US East (N. Virginia)**, a mesma do Render.
3. Em **Connect**, pegue os dados da conexão e monte as três variáveis:
   - `DB_URL`: `jdbc:postgresql://<host>/<banco>?sslmode=require` (o host termina em `.neon.tech`)
   - `DB_USER`: o usuário (por exemplo `neondb_owner`)
   - `DB_PASSWORD`: a senha

As tabelas e os clonemons são criados sozinhos pelo Flyway na primeira vez que o jogo sobe.

## 2. Jogo no Render

1. Crie uma conta em https://render.com entrando com o GitHub.
2. Clique em **New → Blueprint** e escolha este repositório. O Render lê o [`render.yaml`](../render.yaml).
3. Preencha `DB_URL`, `DB_USER` e `DB_PASSWORD` com os valores do Neon. O `JWT_SECRET` é gerado automaticamente.
4. Confirme. O primeiro build leva alguns minutos; o endereço fica em `https://clonemon-xxxx.onrender.com`.

Depois disso, cada merge no `main` com o CI verde publica uma nova versão (`autoDeployTrigger: checksPass`).

## Testar a imagem localmente

O mesmo container do deploy, com um Postgres local:

```bash
docker compose --profile app up -d --build
```

O jogo fica em http://localhost:8081. Para rodar os testes de ponta a ponta contra ele (ou contra o endereço do Render):

```bash
cd frontend && E2E_BASE_URL=http://localhost:8081 npx playwright test
```

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | já vem `prod` na imagem | Sem valores padrão: falta de variável impede a aplicação de subir |
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | sim | Conexão JDBC com o Postgres |
| `JWT_SECRET` | sim | Pelo menos 32 bytes; trocar desloga todo mundo |
| `PORT` | não | O Render define sozinho |
