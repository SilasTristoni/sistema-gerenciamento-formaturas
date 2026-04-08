# Roadmap de Evolucao

Este roadmap combina o estado atual do projeto com uma visao pragmatica de
produto para elevar o sistema a um patamar de plataforma de gestao de formaturas.

## Fase 1. Consolidacao do produto atual

Objetivo: fechar lacunas do que ja esta modelado e fortalecer a base.

### Prioridades

- concluir modulo de tarefas na interface administrativa;
- exibir resultados e percentuais das votacoes na area da comissao;
- adicionar filtros por turma em listagens administrativas;
- exibir historico de presenca por evento e por aluno;
- criar validacoes visuais mais claras nos formularios;
- registrar auditoria minima de exclusoes e alteracoes importantes.

## Fase 2. Maturidade operacional

Objetivo: transformar o sistema em ferramenta de trabalho diaria da comissao.

### Prioridades

- notificacoes internas para eventos, cobrancas e votacoes;
- agenda com checklist por evento;
- visao de pendencias operacionais por responsavel;
- ranking de inadimplencia por turma;
- metas financeiras por turma e acompanhamento de arrecadacao;
- relatorios PDF/CSV de eventos, alunos e financeiro.

## Fase 3. Maturidade financeira e analitica

Objetivo: dar previsibilidade e apoiar decisao.

### Prioridades

- previsao de caixa com cenarios;
- simulacao de entradas e despesas futuras;
- comparativo mensal por turma;
- centro de custos mais estruturado;
- dashboard de receita por aluno;
- alertas automaticos para risco de saldo.

## Fase 4. Escala e governanca

Objetivo: preparar o sistema para uso mais serio e institucional.

### Prioridades

- trilha de auditoria completa;
- perfis adicionais e permissoes mais granulares;
- anexos de comprovantes, contratos e documentos;
- historico de alteracoes em registros;
- politica de backup e restauracao;
- padronizacao de logs e monitoramento.

## Fase 5. Diferenciacao do produto

Objetivo: sair do nivel de sistema academico e caminhar para produto de mercado.

### Prioridades

- PWA/mobile friendly com experiencia offline parcial;
- comunicados segmentados por turma;
- assinaturas digitais de aprovacao;
- integracao com pagamento online;
- scoring de engajamento do aluno;
- recomendacoes automaticas de acao na dashboard.

## Melhorias tecnicas recomendadas

### Backend

- mover regras de negocio dos controllers para services dedicados;
- criar testes de controller e repositorio;
- padronizar tratamento de erros com responses consistentes;
- externalizar segredo JWT por variavel de ambiente;
- adicionar migrations com Flyway ou Liquibase.

### Frontend

- padronizar componentes de formulario;
- reduzir duplicacao entre paginas de dashboard;
- criar camada de estado mais clara;
- adicionar testes de interface quando houver bundler mais estruturado.

## Entregas academicas e de apresentacao

Se o projeto tambem for usado em banca, relatorio ou entrega formal,
esta documentacao pode evoluir com:

- casos de uso;
- matriz de rastreabilidade entre requisitos e implementacao;
- mockups por perfil;
- diagrama de implantacao;
- plano de testes;
- roteiro de demonstracao.
