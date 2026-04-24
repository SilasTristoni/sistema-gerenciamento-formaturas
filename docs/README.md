# Documentacao do Sistema de Gerenciamento de Formaturas

Esta pasta concentra a documentacao funcional, tecnica e arquitetural do projeto.
O objetivo e transformar o repositorio em uma base mais profissional para evolucao,
apresentacao academica, manutencao e planejamento.

## Estrutura

- `01-visao-geral.md`
  Resumo executivo do produto, proposta de valor, atores e modulos.
- `02-requisitos-e-regras.md`
  Requisitos funcionais, requisitos nao funcionais e regras de negocio.
- `03-arquitetura.md`
  Stack, camadas, componentes, fluxos principais e organizacao tecnica.
- `04-diagrama-de-classes.md`
  Diagrama de classes do dominio e visao das classes de aplicacao.
- `05-modelo-de-dados.md`
  DER em Mermaid e explicacao do modelo relacional.
- `08-diagrama-de-casos-de-uso.md`
  Casos de uso reais do sistema com base nos controllers e perfis atuais.
- `06-api-e-fluxos.md`
  Mapa da API REST e principais fluxos de uso.
- `07-roadmap.md`
  Evolucoes recomendadas para o produto.
- `diagramas/casos-de-uso.mmd`
  Fonte Mermaid do diagrama de casos de uso.
- `diagramas/diagrama-classes.mmd`
  Fonte Mermaid do diagrama de classes.
- `diagramas/modelo-relacional-drawsql.mmd`
  Fonte Mermaid do DER.
- `diagramas/schema-drawsql.sql`
  Script SQL para importacao em ferramentas estilo drawSQL/dbdiagram.

## Escopo documentado

Esta documentacao foi elaborada com base no codigo atual do projeto, incluindo:

- autenticacao JWT com perfis de comissao e aluno;
- modulos de turmas, alunos, eventos, financeiro e votacoes;
- dashboard executiva com filtros por turma e periodo;
- modulo de contribuicoes com resumo e registro;
- relatorios financeiros com exportacao;
- portal do aluno com presenca e voto seguro;
- modelo de dados relacional com entidades centrais do dominio;
- modulo de tarefas modelado no backend, mas ainda sem fluxo completo na interface.

## Observacoes importantes

- O projeto usa Spring Boot no backend e frontend estatico com HTML, CSS e JavaScript modular.
- O banco principal e MySQL.
- O ambiente de teste foi ajustado para H2 em memoria.
- O DER foi organizado de forma proxima ao estilo mostrado na imagem de referencia anexada.

## Leitura recomendada

1. Leia `01-visao-geral.md` para entender o produto.
2. Leia `02-requisitos-e-regras.md` para o escopo funcional.
3. Leia `03-arquitetura.md` para o desenho tecnico.
4. Consulte `04-diagrama-de-classes.md`, `05-modelo-de-dados.md` e `08-diagrama-de-casos-de-uso.md`.
5. Use `06-api-e-fluxos.md` para integracoes e testes.
6. Use `07-roadmap.md` para planejamento da proxima iteracao.
