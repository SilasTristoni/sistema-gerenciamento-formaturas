package br.com.senac.formatura.sistema_gerenciamento_formaturas.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record DashboardResumoDTO(
    LocalDateTime generatedAt,
    FilterSnapshot filters,
    Overview overview,
    EventSnapshot nextEvent,
    List<AlertItem> alerts,
    List<MonthlyFinanceItem> monthlyFinancial,
    List<CategoryExpenseItem> expenseCategories,
    List<EventSnapshot> upcomingEvents,
    List<TransactionSnapshot> recentTransactions,
    List<TurmaPerformanceItem> topTurmas,
    OperationalSnapshot operational,
    GoalProgressSnapshot goalProgress,
    List<NotificationItem> notifications,
    ForecastSnapshot forecast
) {
    public record FilterSnapshot(
        Long turmaId,
        String turmaNome,
        int periodMonths,
        String scopeLabel
    ) {}

    public record Overview(
        double saldoTotal,
        double totalReceitas,
        double totalDespesas,
        long totalAlunos,
        long totalTurmas,
        long totalEventos,
        long totalVotacoes,
        int healthScore
    ) {}

    public record EventSnapshot(
        Long id,
        String nome,
        LocalDate data,
        String local,
        String status,
        long diasRestantes
    ) {}

    public record AlertItem(
        String level,
        String title,
        String description
    ) {}

    public record MonthlyFinanceItem(
        String monthKey,
        String monthLabel,
        double receitas,
        double despesas,
        double saldo
    ) {}

    public record CategoryExpenseItem(
        String categoria,
        double valor
    ) {}

    public record TransactionSnapshot(
        Long id,
        String descricao,
        String tipo,
        double valor,
        LocalDate data,
        String referencia,
        String turmaNome
    ) {}

    public record TurmaPerformanceItem(
        Long id,
        String nome,
        String curso,
        int quantidadeAlunos,
        double metaArrecadacao,
        double totalArrecadado,
        double percentualMeta,
        double valorRestanteMeta,
        String status
    ) {}

    public record GoalProgressSnapshot(
        double valorArrecadado,
        double valorMeta,
        double percentualAtingido,
        double valorRestante,
        boolean metaDefinida,
        boolean metaAtingida,
        double sugestaoContribuicaoMedia,
        String titulo,
        String descricao
    ) {}

    public record NotificationItem(
        String level,
        String title,
        String description,
        String actionLabel
    ) {}

    public record OperationalSnapshot(
        double percentualAdimplencia,
        long eventosNoMes,
        long votacoesAbertas,
        double ticketMedioPorAluno
    ) {}

    public record ForecastSnapshot(
        double averageIncome,
        double averageExpense,
        double averageNet,
        double projectedNextBalance,
        String trend,
        String recommendation
    ) {}
}
