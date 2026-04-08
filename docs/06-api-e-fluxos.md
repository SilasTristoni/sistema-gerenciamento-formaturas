# API e Fluxos Principais

## Convencoes gerais

- base path da API: `/api`
- autenticacao: `Authorization: Bearer <token>`
- perfis principais:
  `ROLE_COMISSAO` e `ROLE_ALUNO`

## Endpoints de autenticacao

| Metodo | Rota | Objetivo | Acesso |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | Autenticar usuario e emitir JWT | Publico |
| GET | `/api/auth/me` | Consultar usuario autenticado | Autenticado |

## Endpoints administrativos

### Turmas

| Metodo | Rota |
| --- | --- |
| GET | `/api/cadastro/turmas` |
| POST | `/api/cadastro/turma` |
| PUT | `/api/cadastro/turma/{id}` |
| DELETE | `/api/cadastro/turma/{id}` |

### Alunos

| Metodo | Rota |
| --- | --- |
| GET | `/api/cadastro/alunos` |
| POST | `/api/cadastro/aluno` |
| PUT | `/api/cadastro/aluno/{id}` |
| DELETE | `/api/cadastro/aluno/{id}` |
| POST | `/api/cadastro/alunos/importar` |

### Eventos

| Metodo | Rota |
| --- | --- |
| GET | `/api/cadastro/eventos` |
| POST | `/api/cadastro/evento` |
| PUT | `/api/cadastro/evento/{id}` |
| DELETE | `/api/cadastro/evento/{id}` |

### Financeiro

| Metodo | Rota |
| --- | --- |
| GET | `/api/cadastro/financeiro` |
| POST | `/api/cadastro/lancamento` |
| PUT | `/api/cadastro/lancamento/{id}` |
| DELETE | `/api/cadastro/lancamento/{id}` |

### Votacoes

| Metodo | Rota |
| --- | --- |
| GET | `/api/cadastro/votacoes` |
| POST | `/api/cadastro/votacao` |
| PUT | `/api/cadastro/votacao/{id}` |
| DELETE | `/api/cadastro/votacao/{id}` |
| POST | `/api/cadastro/votacao/{id}/opcao` |

## Endpoints de dashboard e portal do aluno

| Metodo | Rota | Objetivo | Acesso |
| --- | --- | --- | --- |
| GET | `/api/dashboard/resumo` | Dashboard consolidada | Comissao |
| GET | `/api/aluno/painel` | Portal do aluno | Aluno |
| POST | `/api/eventos/confirmar-presenca` | Confirmar presenca | Aluno |
| POST | `/api/votacoes/votar` | Registrar voto seguro | Aluno |

## Parametros especiais

### Dashboard

`GET /api/dashboard/resumo`

Query params suportados:

- `turmaId`
- `periodoMeses`

Exemplo:

```http
GET /api/dashboard/resumo?turmaId=3&periodoMeses=6
Authorization: Bearer <token>
```

## Exemplos de payload

### Login

```json
{
  "login": "admin@gestaoform.com",
  "senha": "admin123"
}
```

### Cadastro de aluno

```json
{
  "nome": "Silas Tristoni",
  "identificador": "silas.tristoni",
  "contato": "silas@email.com",
  "turmaId": 1,
  "perfil": "ALUNO"
}
```

### Cadastro de evento

```json
{
  "nome": "Ensaio geral",
  "data": "2026-09-10",
  "local": "Auditorio central",
  "turmaId": 1
}
```

### Cadastro de lancamento

```json
{
  "descricao": "Pagamento do buffet",
  "tipo": "despesa",
  "valor": 3500.00,
  "data": "2026-08-05",
  "referencia": "Contrato buffet",
  "turmaId": 1
}
```

### Criacao de votacao

```json
{
  "titulo": "Escolha da banda",
  "dataFim": "2026-08-20",
  "turmaId": 1
}
```

### Adicao de opcao

```json
{
  "nome": "Banda Horizonte"
}
```

### Confirmacao de presenca

```json
{
  "eventoId": 5,
  "status": "confirmado"
}
```

### Voto do aluno

```json
{
  "votacaoId": 4,
  "opcaoId": 11
}
```

## Fluxo de autenticacao

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant A as AuthController
    participant S as AutenticacaoService
    participant T as TokenService

    U->>F: informa login e senha
    F->>A: POST /api/auth/login
    A->>S: autenticar credenciais
    S-->>A: usuario autenticado
    A->>T: gerar token
    T-->>A: JWT
    A-->>F: token + perfil + nome
    F->>A: GET /api/auth/me
```

## Fluxo de voto seguro

```mermaid
sequenceDiagram
    participant U as Aluno
    participant F as Frontend
    participant C as VotacaoSeguraController
    participant VR as VotacaoRepository
    participant OR as OpcaoVotacaoRepository
    participant VOR as VotoRepository

    U->>F: escolhe opcao
    F->>C: POST /api/votacoes/votar
    C->>VOR: verificar voto previo
    C->>VR: buscar votacao
    C->>OR: buscar opcao
    C->>VOR: salvar voto
    C-->>F: voto registrado
```

## Fluxo de dashboard

```mermaid
sequenceDiagram
    participant F as Frontend
    participant D as DashboardController
    participant AR as AlunoRepository
    participant TR as TurmaRepository
    participant ER as EventoRepository
    participant LR as LancamentoRepository
    participant VR as VotacaoRepository

    F->>D: GET /api/dashboard/resumo
    D->>TR: buscar turmas
    D->>AR: buscar alunos
    D->>ER: buscar eventos
    D->>LR: buscar lancamentos
    D->>VR: buscar votacoes
    D-->>F: DTO consolidado da dashboard
```

## Regras criticas reforcadas pela API

- somente comissao acessa `/api/cadastro/**`;
- somente comissao acessa `/api/dashboard/**`;
- somente aluno acessa `/api/aluno/**`;
- somente aluno pode votar e confirmar presenca;
- voto e validado contra turma e prazo;
- presenca e validada contra turma do evento.
