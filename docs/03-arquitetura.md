# Arquitetura do Sistema

## Stack tecnologica

### Backend

- Java 17+;
- Spring Boot 4;
- Spring Web MVC;
- Spring Data JPA;
- Spring Security;
- JWT com biblioteca `java-jwt`;
- MySQL como banco principal;
- H2 em memoria para testes.

### Frontend

- HTML estatico;
- CSS customizado;
- JavaScript modular;
- Tailwind via CDN;
- Chart.js para graficos;
- Phosphor Icons para iconografia.

## Estilo arquitetural

O projeto segue uma arquitetura em camadas com separacao clara de
responsabilidades:

- camada de apresentacao:
  paginas HTML, componentes JS e chamadas para API REST;
- camada de controle:
  controllers Spring responsaveis por expor endpoints;
- camada de servico:
  autenticacao e tokenizacao;
- camada de persistencia:
  repositories JPA;
- camada de dominio:
  entidades que representam o negocio da formatura.

## Estrutura logica

```text
Frontend (HTML/CSS/JS)
    ->
API REST Spring Boot
    ->
Controllers
    ->
Services / Regras
    ->
Repositories JPA
    ->
Banco MySQL
```

## Componentes principais

### 1. Modulo de autenticacao

Responsavel por login, emissao de JWT e resolucao do usuario autenticado.

Componentes centrais:

- `AuthController`
- `ContaController`
- `SecurityConfig`
- `SecurityFilter`
- `AutenticacaoService`
- `TokenService`

### 2. Modulo administrativo

Responsavel por CRUD de turmas, alunos, eventos, financeiro e votacoes.

Componente central:

- `CadastroController`

### 3. Dashboard executiva

Responsavel por consolidar indicadores, alertas, eventos, ranking e previsao.

Componente central:

- `DashboardController`

### 4. Portal do aluno

Responsavel por autoatendimento do aluno.

Componentes centrais:

- `AlunoPortalController`
- `PresencaEventoController`
- `VotacaoSeguraController`

## Fluxos tecnicos principais

### Fluxo 1. Login

1. O frontend envia login e senha para `/api/auth/login`.
2. O backend autentica usando `AuthenticationManager`.
3. `TokenService` gera o JWT.
4. O frontend salva a sessao localmente.
5. O frontend chama `/api/auth/me` para identificar perfil e destino.

### Fluxo 2. Dashboard da comissao

1. O frontend chama `/api/dashboard/resumo`.
2. O backend consolida alunos, turmas, eventos, votacoes e lancamentos.
3. O backend aplica filtros opcionais por turma e periodo.
4. O backend devolve um DTO unico para alimentar a tela.
5. O frontend renderiza KPIs, listas, alertas e graficos.

### Fluxo 3. Voto seguro do aluno

1. O aluno autenticado acessa o portal.
2. O frontend envia a opcao para `/api/votacoes/votar`.
3. O backend valida perfil, turma, status da votacao e voto previo.
4. O voto e persistido apenas se todas as regras forem atendidas.

### Fluxo 4. Confirmacao de presenca

1. O aluno escolhe o status no portal.
2. O frontend envia dados para `/api/eventos/confirmar-presenca`.
3. O backend valida turma e atualiza a presenca do aluno no evento.

## Organizacao fisica relevante do repositorio

```text
src/main/java/.../config
src/main/java/.../controller
src/main/java/.../dto
src/main/java/.../model
src/main/java/.../repository
src/main/java/.../service
src/main/resources
frontend/
docs/
```

## Decisoes arquiteturais importantes

### Contratos tipados na dashboard

A dashboard usa DTO especifico em vez de `Map` generico.
Isso reduz acoplamento frouxo e melhora manutencao.

### Seguranca por perfil

O `SecurityConfig` restringe dashboard e cadastro para comissao e portal para aluno.

### Validacao por turma

As regras de voto e presenca nao dependem apenas de frontend.
O backend tambem valida o vinculo do aluno com a turma.

### Frontend desacoplado do backend de views

O frontend e servido como arquivos estaticos e conversa por API REST.
Isso simplifica evolucoes visuais e futuras integracoes.

## Pontos fortes da arquitetura atual

- separacao razoavel entre responsabilidades;
- regra critica protegida no backend;
- dashboard consolidada em endpoint unico;
- base pronta para modularizacao maior;
- testes agora independentes do MySQL local.

## Pontos de atencao

- ainda nao existe camada de servico dedicada para os modulos de negocio alem da autenticacao;
- algumas regras ainda vivem diretamente nos controllers;
- o modulo de tarefas ainda nao esta conectado a interface;
- nao ha ainda trilha de auditoria ou logging de negocio.
