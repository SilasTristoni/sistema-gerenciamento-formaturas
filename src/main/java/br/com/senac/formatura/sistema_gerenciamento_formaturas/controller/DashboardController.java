package br.com.senac.formatura.sistema_gerenciamento_formaturas.controller;

import java.text.DateFormatSymbols;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.DashboardResumoDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Aluno;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Evento;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.LancamentoFinanceiro;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Turma;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Votacao;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.AlunoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.EventoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.LancamentoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.TurmaRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.VotacaoRepository;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private static final Locale LOCALE_PT_BR = Locale.forLanguageTag("pt-BR");

    @Autowired private LancamentoRepository lancamentoRepo;
    @Autowired private AlunoRepository alunoRepo;
    @Autowired private TurmaRepository turmaRepo;
    @Autowired private EventoRepository eventoRepo;
    @Autowired private VotacaoRepository votacaoRepo;

    @GetMapping("/resumo")
    public DashboardResumoDTO getResumo(
        @RequestParam(required = false) Long turmaId,
        @RequestParam(name = "periodoMeses", defaultValue = "6") Integer periodoMeses
    ) {
        LocalDate hoje = LocalDate.now();
        int periodMonths = normalizePeriod(periodoMeses);

        List<Turma> todasTurmas = turmaRepo.findAll();
        Turma turmaSelecionada = resolveTurma(turmaId, todasTurmas);
        List<Turma> turmasEscopo = turmaSelecionada != null ? List.of(turmaSelecionada) : todasTurmas;

        List<Aluno> alunos = filterByTurma(alunoRepo.findAll(), turmaId, aluno ->
            aluno.getTurma() != null ? aluno.getTurma().getId() : null
        );
        List<Evento> eventos = filterByTurma(eventoRepo.findAll(), turmaId, evento ->
            evento.getTurma() != null ? evento.getTurma().getId() : null
        );
        List<LancamentoFinanceiro> lancamentos = filterByTurma(lancamentoRepo.findAll(), turmaId, lancamento ->
            lancamento.getTurma() != null ? lancamento.getTurma().getId() : null
        );
        List<Votacao> votacoes = filterByTurma(votacaoRepo.findAll(), turmaId, votacao ->
            votacao.getTurma() != null ? votacao.getTurma().getId() : null
        );
        List<LancamentoFinanceiro> lancamentosPeriodo = filterLancamentosByPeriod(lancamentos, periodMonths, hoje);

        double receitas = lancamentos.stream()
            .filter(item -> "receita".equalsIgnoreCase(item.getTipo()))
            .mapToDouble(item -> safeDouble(item.getValor()))
            .sum();
        double despesas = lancamentos.stream()
            .filter(item -> "despesa".equalsIgnoreCase(item.getTipo()))
            .mapToDouble(item -> safeDouble(item.getValor()))
            .sum();
        double saldo = round(receitas - despesas);

        long totalAlunos = alunos.size();
        long totalEventos = eventos.size();
        long totalVotacoes = votacoes.size();
        long votacoesAbertas = votacoes.stream()
            .filter(votacao -> "aberta".equalsIgnoreCase(votacao.getStatus()))
            .count();

        List<Evento> eventosOrdenados = eventos.stream()
            .sorted(Comparator.comparing(
                Evento::getDataEvento,
                Comparator.nullsLast(Comparator.naturalOrder())
            ))
            .toList();

        Evento proximoEvento = eventosOrdenados.stream()
            .filter(evento -> evento.getDataEvento() != null && !evento.getDataEvento().isBefore(hoje))
            .findFirst()
            .orElse(eventosOrdenados.stream().findFirst().orElse(null));

        DashboardResumoDTO.Overview overview = new DashboardResumoDTO.Overview(
            saldo,
            round(receitas),
            round(despesas),
            totalAlunos,
            turmasEscopo.size(),
            totalEventos,
            totalVotacoes,
            calculateHealthScore(saldo, totalAlunos, proximoEvento, hoje)
        );

        List<DashboardResumoDTO.AlertItem> alerts = buildAlerts(totalAlunos, saldo, proximoEvento, hoje);
        List<DashboardResumoDTO.MonthlyFinanceItem> monthlyFinancial = buildMonthlyFinancial(lancamentosPeriodo, periodMonths, hoje);
        List<DashboardResumoDTO.CategoryExpenseItem> expenseCategories = buildExpenseCategories(lancamentosPeriodo);
        List<DashboardResumoDTO.EventSnapshot> upcomingEvents = eventosOrdenados.stream()
            .filter(evento -> evento.getDataEvento() == null || !evento.getDataEvento().isBefore(hoje))
            .limit(6)
            .map(evento -> toEventSnapshot(evento, hoje))
            .toList();
        List<DashboardResumoDTO.TransactionSnapshot> recentTransactions = lancamentosPeriodo.stream()
            .sorted(Comparator.comparing(
                LancamentoFinanceiro::getDataLancamento,
                Comparator.nullsLast(Comparator.reverseOrder())
            ))
            .limit(8)
            .map(this::toTransactionSnapshot)
            .toList();
        List<DashboardResumoDTO.TurmaPerformanceItem> topTurmas = turmasEscopo.stream()
            .sorted(Comparator.comparing(
                this::goalProgressForTurma,
                Comparator.reverseOrder()
            ).thenComparing(Turma::getTotalArrecadado, Comparator.nullsLast(Comparator.reverseOrder())))
            .limit(5)
            .map(this::toTurmaPerformanceItem)
            .toList();

        long eventosNoMes = eventos.stream()
            .filter(evento -> evento.getDataEvento() != null
                && evento.getDataEvento().getYear() == hoje.getYear()
                && evento.getDataEvento().getMonth() == hoje.getMonth())
            .count();

        double percentualAdimplencia = totalAlunos == 0 ? 100.0 : 100.0;
        double ticketMedioPorAluno = totalAlunos == 0 ? 0.0 : round(receitas / totalAlunos);

        DashboardResumoDTO.OperationalSnapshot operational = new DashboardResumoDTO.OperationalSnapshot(
            percentualAdimplencia,
            eventosNoMes,
            votacoesAbertas,
            ticketMedioPorAluno
        );
        DashboardResumoDTO.GoalProgressSnapshot goalProgress = buildGoalProgress(turmasEscopo, receitas);

        DashboardResumoDTO.FilterSnapshot filters = new DashboardResumoDTO.FilterSnapshot(
            turmaSelecionada != null ? turmaSelecionada.getId() : null,
            turmaSelecionada != null ? firstNonBlank(turmaSelecionada.getNome(), "Turma selecionada") : "Todas as turmas",
            periodMonths,
            turmaSelecionada != null
                ? "Visao focada na turma " + firstNonBlank(turmaSelecionada.getNome(), "selecionada")
                : "Visao consolidada de todas as turmas"
        );

        DashboardResumoDTO.ForecastSnapshot forecast = buildForecast(monthlyFinancial, saldo);
        List<DashboardResumoDTO.NotificationItem> notifications = buildNotifications(goalProgress, proximoEvento, votacoesAbertas, hoje);

        return new DashboardResumoDTO(
            LocalDateTime.now(),
            filters,
            overview,
            toEventSnapshot(proximoEvento, hoje),
            alerts,
            monthlyFinancial,
            expenseCategories,
            upcomingEvents,
            recentTransactions,
            topTurmas,
            operational,
            goalProgress,
            notifications,
            forecast
        );
    }

    private DashboardResumoDTO.GoalProgressSnapshot buildGoalProgress(List<Turma> turmasEscopo, double receitas) {
        double valorMeta = round(turmasEscopo.stream()
            .mapToDouble(turma -> safeDouble(turma.getMetaArrecadacao()))
            .sum());
        double valorArrecadado = round(Math.max(0.0, receitas));
        boolean metaDefinida = valorMeta > 0;
        double percentualAtingido = metaDefinida ? round((valorArrecadado / valorMeta) * 100.0) : 0.0;
        double valorRestante = metaDefinida ? round(Math.max(0.0, valorMeta - valorArrecadado)) : 0.0;
        boolean metaAtingida = metaDefinida && percentualAtingido >= 100.0;
        long totalAlunos = turmasEscopo.stream()
            .mapToLong(turma -> Math.max(turma.getQuantidadeAlunos(), 0))
            .sum();
        double sugestaoContribuicaoMedia = !metaDefinida || totalAlunos <= 0 ? 0.0 : round(valorRestante / totalAlunos);

        String titulo;
        String descricao;

        if (!metaDefinida) {
            titulo = "Meta ainda nao definida";
            descricao = "Cadastre uma meta para a turma e acompanhe a arrecadacao em tempo real.";
        } else if (metaAtingida) {
            titulo = "Meta financeira atingida";
            descricao = "A arrecadacao ja bateu o objetivo definido para este escopo.";
        } else {
            titulo = "Meta financeira em andamento";
            descricao = "Faltam " + formatCurrency(valorRestante)
                + " para bater a meta. Como referencia opcional, isso representa "
                + formatCurrency(sugestaoContribuicaoMedia)
                + " por participante.";
        }

        return new DashboardResumoDTO.GoalProgressSnapshot(
            valorArrecadado,
            valorMeta,
            percentualAtingido,
            valorRestante,
            metaDefinida,
            metaAtingida,
            sugestaoContribuicaoMedia,
            titulo,
            descricao
        );
    }

    private List<DashboardResumoDTO.NotificationItem> buildNotifications(
        DashboardResumoDTO.GoalProgressSnapshot goalProgress,
        Evento proximoEvento,
        long votacoesAbertas,
        LocalDate hoje
    ) {
        List<DashboardResumoDTO.NotificationItem> notifications = new ArrayList<>();

        if (!goalProgress.metaDefinida()) {
            notifications.add(new DashboardResumoDTO.NotificationItem(
                "warning",
                "Defina a meta financeira",
                "Sem meta cadastrada, fica mais dificil orientar contribuicoes e previsao de caixa.",
                "Atualizar turma"
            ));
        } else if (!goalProgress.metaAtingida() && goalProgress.percentualAtingido() >= 80) {
            notifications.add(new DashboardResumoDTO.NotificationItem(
                "success",
                "Meta na reta final",
                "A arrecadacao ja passou de 80% do objetivo. Vale reforcar a campanha de contribuicao da turma.",
                "Ver turmas"
            ));
        }

        if (proximoEvento != null && proximoEvento.getDataEvento() != null) {
            long dias = ChronoUnit.DAYS.between(hoje, proximoEvento.getDataEvento());
            if (dias >= 0 && dias <= 7) {
                notifications.add(new DashboardResumoDTO.NotificationItem(
                    "warning",
                    "Evento muito proximo",
                    "Revise presenca e caixa antes de " + firstNonBlank(proximoEvento.getNome(), "o evento") + ".",
                    "Abrir agenda"
                ));
            }
        }

        if (votacoesAbertas > 0) {
            notifications.add(new DashboardResumoDTO.NotificationItem(
                "info",
                "Votacoes abertas",
                "Existem " + votacoesAbertas + " votacoes abertas aguardando engajamento da turma.",
                "Acompanhar votacoes"
            ));
        }

        if (notifications.isEmpty()) {
            notifications.add(new DashboardResumoDTO.NotificationItem(
                "success",
                "Operacao sob controle",
                "Meta, agenda e financeiro estao sem sinais criticos no momento.",
                "Seguir monitorando"
            ));
        }

        return notifications;
    }

    private List<DashboardResumoDTO.MonthlyFinanceItem> buildMonthlyFinancial(
        List<LancamentoFinanceiro> lancamentos,
        int periodMonths,
        LocalDate hoje
    ) {
        YearMonth currentMonth = YearMonth.from(hoje);
        YearMonth startMonth = currentMonth.minusMonths(periodMonths - 1L);
        Map<YearMonth, double[]> grouped = new LinkedHashMap<>();

        for (int index = 0; index < periodMonths; index++) {
            grouped.put(startMonth.plusMonths(index), new double[2]);
        }

        lancamentos.stream()
            .filter(item -> item.getDataLancamento() != null)
            .forEach(item -> {
                YearMonth month = YearMonth.from(item.getDataLancamento());
                if (month.isBefore(startMonth) || month.isAfter(currentMonth)) return;

                double[] values = grouped.computeIfAbsent(month, key -> new double[2]);
                if ("receita".equalsIgnoreCase(item.getTipo())) {
                    values[0] += safeDouble(item.getValor());
                } else {
                    values[1] += safeDouble(item.getValor());
                }
            });

        return grouped.entrySet().stream()
            .map(entry -> {
                String monthKey = "%d-%02d".formatted(entry.getKey().getYear(), entry.getKey().getMonthValue());
                String monthLabel = abbreviateMonth(entry.getKey().getMonthValue())
                    + "/" + String.valueOf(entry.getKey().getYear()).substring(2);
                double receitas = round(entry.getValue()[0]);
                double despesas = round(entry.getValue()[1]);
                return new DashboardResumoDTO.MonthlyFinanceItem(
                    monthKey,
                    monthLabel,
                    receitas,
                    despesas,
                    round(receitas - despesas)
                );
            })
            .toList();
    }

    private List<DashboardResumoDTO.CategoryExpenseItem> buildExpenseCategories(List<LancamentoFinanceiro> lancamentos) {
        Map<String, Double> grouped = new LinkedHashMap<>();

        lancamentos.stream()
            .filter(item -> "despesa".equalsIgnoreCase(item.getTipo()))
            .forEach(item -> {
                String categoria = firstNonBlank(item.getReferencia(), item.getDescricao(), "Sem categoria");
                grouped.merge(categoria, safeDouble(item.getValor()), Double::sum);
            });

        return grouped.entrySet().stream()
            .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
            .limit(5)
            .map(entry -> new DashboardResumoDTO.CategoryExpenseItem(entry.getKey(), round(entry.getValue())))
            .toList();
    }

    private DashboardResumoDTO.ForecastSnapshot buildForecast(
        List<DashboardResumoDTO.MonthlyFinanceItem> monthlyFinancial,
        double saldoAtual
    ) {
        double averageIncome = round(monthlyFinancial.stream()
            .mapToDouble(DashboardResumoDTO.MonthlyFinanceItem::receitas)
            .average()
            .orElse(0.0));
        double averageExpense = round(monthlyFinancial.stream()
            .mapToDouble(DashboardResumoDTO.MonthlyFinanceItem::despesas)
            .average()
            .orElse(0.0));
        double averageNet = round(averageIncome - averageExpense);
        double projectedNextBalance = round(saldoAtual + averageNet);

        String trend;
        String recommendation;

        if (averageNet > 0) {
            trend = "positive";
            recommendation = "A media recente indica folga de caixa. Considere antecipar reservas e negociar contratos.";
        } else if (averageNet < 0) {
            trend = "warning";
            recommendation = "A media recente pressiona o caixa. Reforce a campanha de contribuicoes e segure novas despesas.";
        } else {
            trend = "neutral";
            recommendation = "A operacao esta estavel, mas sem margem. Vale acompanhar entradas e saidas mais de perto.";
        }

        return new DashboardResumoDTO.ForecastSnapshot(
            averageIncome,
            averageExpense,
            averageNet,
            projectedNextBalance,
            trend,
            recommendation
        );
    }

    private List<DashboardResumoDTO.AlertItem> buildAlerts(long totalAlunos, double saldo, Evento proximoEvento, LocalDate hoje) {
        List<DashboardResumoDTO.AlertItem> alerts = new ArrayList<>();

        if (saldo < 0) {
            alerts.add(new DashboardResumoDTO.AlertItem(
                "high",
                "Saldo negativo",
                "As despesas superam as receitas. Reforce comunicacao sobre contribuicoes e revise custos."
            ));
        }

        if (proximoEvento == null) {
            alerts.add(new DashboardResumoDTO.AlertItem(
                "medium",
                "Agenda sem proximo evento",
                "Cadastre os proximos marcos da formatura para dar previsibilidade ao time."
            ));
        } else if (proximoEvento.getDataEvento() != null) {
            long dias = ChronoUnit.DAYS.between(hoje, proximoEvento.getDataEvento());
            if (dias >= 0 && dias <= 15) {
                alerts.add(new DashboardResumoDTO.AlertItem(
                    dias <= 7 ? "high" : "medium",
                    "Evento proximo",
                    "O evento %s acontece em %s dias.".formatted(proximoEvento.getNome(), dias)
                ));
            }
        }

        if (alerts.isEmpty()) {
            alerts.add(new DashboardResumoDTO.AlertItem(
                "low",
                "Operacao estavel",
                "Sem alertas criticos no momento. Continue monitorando caixa e agenda."
            ));
        }

        return alerts;
    }

    private List<LancamentoFinanceiro> filterLancamentosByPeriod(
        List<LancamentoFinanceiro> lancamentos,
        int periodMonths,
        LocalDate hoje
    ) {
        LocalDate startDate = YearMonth.from(hoje).minusMonths(periodMonths - 1L).atDay(1);
        return lancamentos.stream()
            .filter(item -> item.getDataLancamento() != null && !item.getDataLancamento().isBefore(startDate))
            .toList();
    }

    private <T> List<T> filterByTurma(List<T> items, Long turmaId, Function<T, Long> turmaExtractor) {
        if (turmaId == null) return items;
        return items.stream()
            .filter(item -> turmaId.equals(turmaExtractor.apply(item)))
            .toList();
    }

    private Turma resolveTurma(Long turmaId, List<Turma> turmas) {
        if (turmaId == null) return null;

        return turmas.stream()
            .filter(turma -> turmaId.equals(turma.getId()))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turma nao encontrada."));
    }

    private DashboardResumoDTO.EventSnapshot toEventSnapshot(Evento evento, LocalDate hoje) {
        if (evento == null) {
            return new DashboardResumoDTO.EventSnapshot(null, "Nenhum agendado", null, "Local a definir", "planejamento", -1);
        }

        long diasRestantes = evento.getDataEvento() == null ? -1 : ChronoUnit.DAYS.between(hoje, evento.getDataEvento());
        return new DashboardResumoDTO.EventSnapshot(
            evento.getId(),
            evento.getNome(),
            evento.getDataEvento(),
            firstNonBlank(evento.getLocalEvento(), "Local a definir"),
            firstNonBlank(evento.getStatus(), "agendado"),
            diasRestantes
        );
    }

    private DashboardResumoDTO.TransactionSnapshot toTransactionSnapshot(LancamentoFinanceiro lancamento) {
        return new DashboardResumoDTO.TransactionSnapshot(
            lancamento.getId(),
            firstNonBlank(lancamento.getDescricao(), "Lancamento sem descricao"),
            firstNonBlank(lancamento.getTipo(), "despesa"),
            round(safeDouble(lancamento.getValor())),
            lancamento.getDataLancamento(),
            firstNonBlank(lancamento.getReferencia(), "Sem referencia"),
            lancamento.getTurma() != null ? firstNonBlank(lancamento.getTurma().getNome(), "Sem turma") : "Sem turma"
        );
    }

    private DashboardResumoDTO.TurmaPerformanceItem toTurmaPerformanceItem(Turma turma) {
        double meta = round(safeDouble(turma.getMetaArrecadacao()));
        double arrecadado = round(safeDouble(turma.getTotalArrecadado()));
        double percentualMeta = meta <= 0 ? 0.0 : round((arrecadado / meta) * 100.0);
        double valorRestanteMeta = meta <= 0 ? 0.0 : round(Math.max(0.0, meta - arrecadado));
        return new DashboardResumoDTO.TurmaPerformanceItem(
            turma.getId(),
            firstNonBlank(turma.getNome(), "Turma sem nome"),
            firstNonBlank(turma.getCurso(), "Curso nao informado"),
            turma.getQuantidadeAlunos(),
            meta,
            arrecadado,
            percentualMeta,
            valorRestanteMeta,
            firstNonBlank(turma.getStatus(), "emdia")
        );
    }

    private int calculateHealthScore(double saldo, long totalAlunos, Evento proximoEvento, LocalDate hoje) {
        int score = 82;

        if (saldo < 0) score -= 28;
        else if (saldo == 0) score -= 10;

        if (proximoEvento == null || proximoEvento.getDataEvento() == null) {
            score -= 8;
        } else {
            long dias = ChronoUnit.DAYS.between(hoje, proximoEvento.getDataEvento());
            if (dias < 0) score -= 10;
            else if (dias <= 7) score -= 4;
        }

        return Math.max(0, Math.min(100, score));
    }

    private double goalProgressForTurma(Turma turma) {
        double meta = safeDouble(turma.getMetaArrecadacao());
        if (meta <= 0) return 0.0;
        return round((safeDouble(turma.getTotalArrecadado()) / meta) * 100.0);
    }


    private int normalizePeriod(Integer periodMonths) {
        if (periodMonths == null) return 6;
        return Math.max(1, Math.min(12, periodMonths));
    }

    private double safeDouble(Double value) {
        return value == null ? 0.0 : value;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private String abbreviateMonth(int month) {
        String[] months = new DateFormatSymbols(LOCALE_PT_BR).getShortMonths();
        if (month < 1 || month > 12) return "--";
        return months[month - 1].replace(".", "").toLowerCase(LOCALE_PT_BR);
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    private String formatCurrency(double value) {
        return "R$ %.2f".formatted(value).replace('.', ',');
    }
}
