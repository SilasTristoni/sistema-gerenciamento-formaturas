# Diagrama de Classes

Este documento apresenta duas visoes:

- visao de dominio, focada nas entidades de negocio;
- visao de aplicacao, focada nos componentes de autenticacao, controllers e persistencia.

O arquivo fonte em Mermaid esta em `diagramas/diagrama-classes.mmd`.

## 1. Diagrama de classes do dominio

```mermaid
classDiagram
    class Turma {
        +Long id
        +String nome
        +String curso
        +String instituicao
        +Double totalArrecadado
        +String status
        +Integer getQuantidadeAlunos()
    }

    class Aluno {
        +Long id
        +String nome
        +String identificador
        +String contato
        +String status
        +String getNomeTurma()
    }

    class Usuario {
        +Long id
        +String login
        +String email
        +String senha
        +Perfil perfil
        +String getUsername()
    }

    class Evento {
        +Long id
        +String nome
        +LocalDate dataEvento
        +String localEvento
        +String status
    }

    class PresencaEvento {
        +Long id
        +String status
    }

    class LancamentoFinanceiro {
        +Long id
        +String descricao
        +String tipo
        +Double valor
        +LocalDate dataLancamento
        +String referencia
    }

    class Votacao {
        +Long id
        +String titulo
        +String status
        +LocalDate dataFim
    }

    class OpcaoVotacao {
        +Long id
        +String nomeFornecedor
        +String detalhesProposta
        +Double valorProposta
    }

    class Voto {
        +Long id
        +LocalDateTime dataVoto
    }

    class Tarefa {
        +Long id
        +String titulo
        +String descricao
        +String status
        +LocalDate dataLimite
    }

    class Perfil {
        <<enumeration>>
        ROLE_COMISSAO
        ROLE_ALUNO
    }

    Turma "1" --> "*" Aluno
    Turma "1" --> "*" Evento
    Turma "1" --> "*" LancamentoFinanceiro
    Turma "1" --> "*" Votacao
    Turma "1" --> "*" Tarefa

    Aluno "1" --> "0..1" Usuario
    Aluno "1" --> "*" Voto
    Aluno "1" --> "*" PresencaEvento
    Aluno "0..1" --> "*" Tarefa : responsavel
    Aluno "0..1" --> "*" LancamentoFinanceiro : referencia opcional

    Evento "1" --> "*" PresencaEvento
    Votacao "1" --> "*" OpcaoVotacao
    Votacao "1" --> "*" Voto
    OpcaoVotacao "1" --> "*" Voto

    Usuario --> Perfil
```

## 2. Diagrama de classes da aplicacao

```mermaid
classDiagram
    class AuthController
    class ContaController
    class CadastroController
    class DashboardController
    class AlunoPortalController
    class PresencaEventoController
    class VotacaoSeguraController

    class AutenticacaoService
    class TokenService
    class SecurityFilter
    class SecurityConfig

    class AlunoRepository
    class TurmaRepository
    class EventoRepository
    class LancamentoRepository
    class UsuarioRepository
    class VotacaoRepository
    class VotoRepository
    class PresencaEventoRepository
    class OpcaoVotacaoRepository

    class DashboardResumoDTO
    class AlunoPainelResponseDTO
    class UsuarioLogadoResponseDTO

    AuthController --> TokenService
    ContaController --> UsuarioLogadoResponseDTO
    CadastroController --> AlunoRepository
    CadastroController --> TurmaRepository
    CadastroController --> EventoRepository
    CadastroController --> LancamentoRepository
    CadastroController --> VotacaoRepository
    CadastroController --> VotoRepository
    CadastroController --> UsuarioRepository
    DashboardController --> DashboardResumoDTO
    DashboardController --> AlunoRepository
    DashboardController --> TurmaRepository
    DashboardController --> EventoRepository
    DashboardController --> LancamentoRepository
    DashboardController --> VotacaoRepository
    AlunoPortalController --> EventoRepository
    AlunoPortalController --> VotacaoRepository
    AlunoPortalController --> PresencaEventoRepository
    AlunoPortalController --> VotoRepository
    AlunoPortalController --> AlunoPainelResponseDTO
    PresencaEventoController --> EventoRepository
    PresencaEventoController --> PresencaEventoRepository
    VotacaoSeguraController --> VotacaoRepository
    VotacaoSeguraController --> VotoRepository
    VotacaoSeguraController --> OpcaoVotacaoRepository
    SecurityFilter --> TokenService
    SecurityFilter --> UsuarioRepository
    SecurityConfig --> SecurityFilter
    AutenticacaoService --> UsuarioRepository
```

## Interpretacao pratica

### Nucleo do dominio

O centro do sistema e a entidade `Turma`.
Quase todos os elementos operacionais da formatura nascem dela:

- alunos;
- eventos;
- lancamentos;
- votacoes;
- tarefas.

### Controle de acesso

`Usuario` faz a ponte entre autenticacao e negocio.
Quando o usuario representa um aluno, ele se vincula a `Aluno`.
Quando representa a comissao, pode existir sem vinculo direto com aluno.

### Participacao do aluno

O aluno participa do sistema por dois caminhos principais:

- `PresencaEvento`
- `Voto`

Isso permite medir engajamento, tomada de decisao e preparacao dos eventos.

### Base para crescimento

A presenca da classe `Tarefa` mostra que o dominio ja esta pronto para crescer
em direcao a um modulo de operacao e pendencias, mesmo antes da tela existir.
