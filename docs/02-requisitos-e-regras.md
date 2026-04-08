# Requisitos e Regras de Negocio

## Requisitos funcionais

| ID | Requisito | Perfil principal | Status |
| --- | --- | --- | --- |
| RF01 | Permitir login por identificador, login ou email | Comissao / Aluno | Implementado |
| RF02 | Emitir token JWT para sessao autenticada | Comissao / Aluno | Implementado |
| RF03 | Permitir consultar os dados do usuario logado | Comissao / Aluno | Implementado |
| RF04 | Permitir cadastrar, editar, listar e excluir turmas | Comissao | Implementado |
| RF05 | Permitir cadastrar, editar, listar e excluir alunos | Comissao | Implementado |
| RF06 | Permitir importar alunos por CSV | Comissao | Implementado |
| RF07 | Gerar login padrao do aluno a partir de identificador unico | Comissao | Implementado |
| RF08 | Definir perfil do usuario criado a partir do cadastro do aluno | Comissao | Implementado |
| RF09 | Permitir cadastrar, editar, listar e excluir eventos | Comissao | Implementado |
| RF10 | Permitir visualizar eventos em calendario e lista | Comissao | Implementado |
| RF11 | Permitir criar evento rapido pela agenda | Comissao | Implementado |
| RF12 | Permitir cadastrar, editar, listar e excluir lancamentos financeiros | Comissao | Implementado |
| RF13 | Exibir dashboard consolidada da operacao | Comissao | Implementado |
| RF14 | Filtrar dashboard por turma e por periodo de meses | Comissao | Implementado |
| RF15 | Exibir score de saude, alertas e previsao financeira | Comissao | Implementado |
| RF16 | Permitir cadastrar, editar, listar e excluir votacoes | Comissao | Implementado |
| RF17 | Permitir adicionar opcoes em uma votacao | Comissao | Implementado |
| RF18 | Permitir que aluno vote uma unica vez por votacao | Aluno | Implementado |
| RF19 | Restringir voto para votacoes da turma do aluno | Aluno | Implementado |
| RF20 | Bloquear voto em votacao encerrada ou expirada | Aluno | Implementado |
| RF21 | Permitir que aluno visualize seu painel pessoal | Aluno | Implementado |
| RF22 | Permitir que aluno confirme presenca em evento | Aluno | Implementado |
| RF23 | Restringir presenca para eventos da turma do aluno | Aluno | Implementado |
| RF24 | Exibir votacoes, eventos e proximo compromisso no portal do aluno | Aluno | Implementado |
| RF25 | Exportar dados tabulares para CSV pela interface | Comissao | Implementado |
| RF26 | Gerenciar tarefas com responsavel e prazo | Comissao | Parcial |
| RF27 | Exibir ranking de desempenho financeiro por turma | Comissao | Implementado |
| RF28 | Exibir historico mensal de receitas, despesas e saldo | Comissao | Implementado |
| RF29 | Exibir maiores categorias de despesa | Comissao | Implementado |
| RF30 | Redirecionar usuarios automaticamente para a area correta conforme perfil | Comissao / Aluno | Implementado |

## Requisitos nao funcionais

| ID | Requisito | Descricao |
| --- | --- | --- |
| RNF01 | Seguranca | O sistema deve exigir autenticacao para recursos protegidos e separar acesso por perfil. |
| RNF02 | Integridade | O sistema deve evitar voto duplicado e validar vinculo entre aluno, turma, evento e votacao. |
| RNF03 | Usabilidade | A interface deve funcionar em desktop e mobile, com leitura clara para comissao e aluno. |
| RNF04 | Performance | A dashboard deve consolidar dados em poucos requests e reduzir logica duplicada no frontend. |
| RNF05 | Manutenibilidade | O backend deve expor DTOs tipados para contratos mais estaveis. |
| RNF06 | Testabilidade | O ambiente de teste deve rodar sem depender do mesmo banco MySQL principal. |
| RNF07 | Portabilidade | O projeto deve aceitar configuracao por variaveis de ambiente no datasource principal. |
| RNF08 | Evolutividade | A arquitetura deve permitir adicionar modulos como tarefas, notificacoes e relatorios. |

## Regras de negocio

### Autenticacao e perfis

- RN01: todo usuario autenticado deve possuir um perfil de acesso.
- RN02: usuarios de comissao acessam dashboard e modulo de cadastro.
- RN03: usuarios alunos acessam o portal do aluno.

### Alunos e usuarios

- RN04: ao cadastrar um aluno, o sistema deve criar um usuario correspondente.
- RN05: o identificador do aluno deve ser unico.
- RN06: se o identificador nao for informado, o sistema deve gerar um valor padrao a partir do nome.
- RN07: o login do usuario deve priorizar o identificador; na falta dele, o sistema usa email.
- RN08: a senha inicial padrao de alunos criados pelo cadastro e `mudar123`.

### Eventos e presenca

- RN09: um evento deve estar vinculado a uma turma.
- RN10: um aluno so pode confirmar presenca em eventos da propria turma.
- RN11: a confirmacao de presenca deve aceitar estados como `confirmado`, `talvez` e `nao vou`.

### Financeiro

- RN12: todo lancamento financeiro deve estar vinculado a uma turma.
- RN13: receitas aumentam o saldo; despesas reduzem o saldo.
- RN14: a dashboard deve calcular previsao simples a partir da media do periodo filtrado.

### Votacoes

- RN15: toda votacao deve estar vinculada a uma turma.
- RN16: toda opcao deve pertencer a uma votacao.
- RN17: um aluno pode votar apenas uma vez por votacao.
- RN18: um aluno nao pode votar em votacao de outra turma.
- RN19: votacoes encerradas ou com prazo vencido nao devem aceitar voto.

### Dashboard

- RN20: a dashboard deve consolidar visao financeira, agenda e riscos operacionais.
- RN21: o score de saude deve considerar saldo, inadimplencia e proximo evento.
- RN22: os alertas devem priorizar saldo negativo, inadimplencia e proximidade de evento.

## Requisitos estrategicos recomendados para as proximas iteracoes

Os itens abaixo ainda nao fazem parte do escopo fechado, mas sao fortemente
recomendados para a maturidade do produto:

- notificacoes por evento, votacao e cobranca;
- dashboard de tarefas e pendencias operacionais;
- relatorios financeiros por turma e por periodo;
- auditoria de alteracoes;
- historico de presencas por evento e aluno;
- analytics de engajamento da turma;
- anexos de contratos, comprovantes e documentos;
- metas financeiras por turma.
