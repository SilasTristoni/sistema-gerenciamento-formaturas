# Documentação do Sistema de Gerenciamento de Formaturas

Esta pasta concentra a documentação funcional, técnica e arquitetural do projeto.

O objetivo é transformar o repositório em uma base mais profissional para evolução, apresentação acadêmica, manutenção e planejamento do sistema.

## Estrutura

* `01-visao-geral.md`
  Resumo executivo do produto, proposta de valor, atores e módulos.

* `02-requisitos-e-regras.md`
  Requisitos funcionais, requisitos não funcionais e regras de negócio.

* `03-arquitetura.md`
  Stack, camadas, componentes, fluxos principais e organização técnica.

* `04-diagrama-de-classes.md`
  Diagrama de classes do domínio e visão das classes de aplicação.

* `05-modelo-de-dados.md`
  DER em Mermaid e explicação do modelo relacional.

* `06-api-e-fluxos.md`
  Mapa da API REST e principais fluxos de uso.

* `07-roadmap.md`
  Evoluções recomendadas para o produto.

* `08-diagrama-de-casos-de-uso.md`
  Casos de uso reais do sistema com base nos controllers e perfis atuais.

* `diagramas/casos-de-uso.mmd`
  Fonte Mermaid do diagrama de casos de uso.

* `diagramas/diagrama-classes.mmd`
  Fonte Mermaid do diagrama de classes.

* `diagramas/modelo-relacional-drawsql.mmd`
  Fonte Mermaid do DER.

* `diagramas/schema-drawsql.sql`
  Script SQL para importação em ferramentas como drawSQL ou dbdiagram.

## Escopo documentado

Esta documentação foi elaborada com base no código atual do projeto, incluindo:

* autenticação JWT com perfis de comissão e aluno;
* módulos de turmas, alunos, eventos, financeiro e votações;
* dashboard executiva com filtros por turma e período;
* módulo de contribuições com resumo e registro;
* relatórios financeiros com exportação;
* portal do aluno com presença e voto seguro;
* modelo de dados relacional com entidades centrais do domínio;
* módulo de tarefas modelado no backend, mas ainda sem fluxo completo na interface.

## Observações importantes

* O projeto utiliza Spring Boot no backend.
* O frontend é estático, utilizando HTML, CSS e JavaScript modular.
* O banco principal do projeto é MySQL.
* O ambiente de teste foi ajustado para H2 em memória.
* O DER foi organizado de forma próxima ao estilo mostrado na imagem de referência anexada.
* Foi adicionado suporte de host por meio de Docker.

## Leitura recomendada

1. Leia `01-visao-geral.md` para entender o produto.
2. Leia `02-requisitos-e-regras.md` para compreender o escopo funcional.
3. Leia `03-arquitetura.md` para visualizar o desenho técnico.
4. Consulte `04-diagrama-de-classes.md`, `05-modelo-de-dados.md` e `08-diagrama-de-casos-de-uso.md`.
5. Use `06-api-e-fluxos.md` para integrações e testes.
6. Use `07-roadmap.md` para planejamento da próxima iteração.
