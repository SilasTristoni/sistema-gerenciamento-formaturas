package br.com.senac.formatura.sistema_gerenciamento_formaturas.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record RelatorioFinanceiroDTO(
    LocalDateTime generatedAt,
    FilterSnapshot filters,
    SummarySnapshot summary,
    List<MonthlyIndicator> monthlyIndicators,
    List<TurmaIndicator> topTurmas,
    List<TransactionItem> recentTransactions,
    List<InsightItem> insights
) {
    public record FilterSnapshot(
        Long turmaId,
        String turmaNome,
        int periodMonths,
        String scopeLabel
    ) {}

    public record SummarySnapshot(
        double saldoAtualEscopo,
        double saldoPeriodo,
        double receitasPeriodo,
        double despesasPeriodo,
        double totalContribuicoesPeriodo,
        double participacaoContribuicoesReceita,
        double mediaMensalReceitas,
        double mediaMensalDespesas,
        double resultadoMedioMensal,
        double coberturaCaixaMeses,
        long totalLancamentosPeriodo,
        double maiorReceitaPeriodo,
        double maiorDespesaPeriodo
    ) {}

    public record MonthlyIndicator(
        String monthKey,
        String monthLabel,
        double receitas,
        double despesas,
        double contribuicoes,
        double saldo
    ) {}

    public record TurmaIndicator(
        Long id,
        String nome,
        String curso,
        int quantidadeAlunos,
        double totalArrecadado,
        double metaArrecadacao,
        double percentualMeta,
        String status
    ) {}

    public record TransactionItem(
        Long id,
        LocalDate data,
        String descricao,
        String tipo,
        double valor,
        boolean contribuicao,
        String turmaNome,
        String referencia,
        String apoiadorNome
    ) {}

    public record InsightItem(
        String tone,
        String title,
        String description
    ) {}
}
