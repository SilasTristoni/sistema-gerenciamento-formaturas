# Visao Geral

## Nome do sistema

Sistema de Gerenciamento de Formaturas

## Problema que o sistema resolve

Comissoes de formatura normalmente controlam alunos, eventos, valores recebidos,
despesas, votacoes e comunicacao em planilhas, grupos de mensagens e anotacoes
isoladas. Isso gera baixa visibilidade, retrabalho, falhas de controle e pouca
confianca para tomada de decisao.

## Objetivo do produto

Centralizar a gestao operacional e financeira da formatura em uma unica
plataforma, com dois eixos principais:

- gestao da comissao, com visao administrativa e executiva;
- autoatendimento do aluno, com participacao segura nas decisoes da turma.

## Publicos do sistema

### 1. Comissao

Responsavel por administrar turmas, alunos, eventos, lancamentos financeiros,
votacoes e indicadores de saude da operacao.

### 2. Aluno

Responsavel por acompanhar o calendario da turma, confirmar presenca em eventos
e votar nas enquetes que impactam a formatura.

## Proposta de valor

O projeto deixa de ser apenas um cadastro simples e passa a atuar como
plataforma de coordenacao da jornada da formatura:

- consolida caixa e agenda em uma dashboard;
- reduz dependencias de planilhas externas;
- melhora previsibilidade para a comissao;
- cria experiencia separada para aluno e administracao;
- reforca regras de acesso por perfil e por turma.

## Modulos atualmente presentes

### Modulos implementados

- autenticacao com JWT;
- identificacao do usuario logado;
- cadastro de turmas;
- cadastro e importacao de alunos;
- geracao de login do aluno a partir de identificador;
- cadastro e consulta de eventos;
- agenda/calendario com criacao rapida de eventos;
- cadastro de lancamentos financeiros;
- votacoes com opcoes;
- voto seguro por aluno logado;
- portal do aluno;
- confirmacao de presenca em eventos;
- dashboard executiva com KPIs, alertas, agenda e previsao simples.

### Modulos parcialmente maduros

- votacoes na area da comissao:
  a gestao existe, mas ainda pode evoluir para ranking, percentual de votos e encerramento guiado.
- tarefas:
  a entidade existe no backend, mas ainda nao ha modulo visivel na interface.

## Diferenciais que ja colocam o projeto em um nivel acima

- perfis separados entre comissao e aluno;
- dashboard consolidada em endpoint tipado;
- filtro por turma e periodo na analise executiva;
- previsao financeira simples baseada em media recente;
- regras de seguranca que impedem voto e presenca fora da turma;
- ambiente de teste desacoplado do banco principal.

## Visao de produto desejada

Para se tornar um gerenciador de formaturas de alto nivel, a plataforma deve
evoluir nos seguintes pilares:

- operacao:
  tarefas, pendencias, checklists, responsaveis e historico.
- financeiro:
  metas por turma, previsao de caixa mais robusta, inadimplencia detalhada e relatorios.
- engajamento:
  notificacoes, comunicados, lembretes e presenca monitorada.
- governanca:
  auditoria, trilha de alteracoes, regras por perfil e fechamento de ciclos.
- inteligencia:
  insights de risco, recomendacoes automaticas e visao por periodo.
