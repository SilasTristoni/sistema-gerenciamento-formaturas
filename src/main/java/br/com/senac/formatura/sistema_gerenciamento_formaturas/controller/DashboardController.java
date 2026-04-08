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
        long inadimplentes = alunos.stream()
            .filter(aluno -> isInadimplente(aluno.getStatus()))
            .count();
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
            inadimplentes,
            totalEventos,
            totalVotacoes,
            calculateHealthScore(saldo, inadimplentes, totalAlunos, proximoEvento, hoje)
        );

        List<DashboardResumoDTO.AlertItem> alerts = buildAlerts(inadimplentes, totalAlunos, saldo, proximoEvento, hoje);
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
                Turma::getTotalArrecadado,
                Comparator.nullsLast(Comparator.reverseOrder())
            ))
            .limit(5)
            .map(this::toTurmaPerformanceItem)
            .toList();

        long eventosNoMes = eventos.stream()
            .filter(evento -> evento.getDataEvento() != null
                && evento.getDataEvento().getYear() == hoje.getYear()
                && evento.getDataEvento().getMonth() == hoje.getMonth())
            .count();

        double percentualAdimplencia = totalAlunos == 0
            ? 100.0
            : round((double) (totalAlunos - inadimplentes) * 100 / totalAlunos);
        double ticketMedioPorAluno = totalAlunos == 0 ? 0.0 : round(receitas / totalAlunos);

        DashboardResumoDTO.OperationalSnapshot operational = new DashboardResumoDTO.OperationalSnapshot(
            percentualAdimplencia,
            eventosNoMes,
            votacoesAbertas,
            ticketMedioPorAluno
        );

        DashboardResumoDTO.FilterSnapshot filters = new DashboardResumoDTO.FilterSnapshot(
            turmaSelecionada != null ? turmaSelecionada.getId() : null,
            turmaSelecionada != null ? firstNonBlank(turmaSelecionada.getNome(), "Turma selecionada") : "Todas as turmas",
            periodMonths,
            turmaSelecionada != null
                ? "Visao focada na turma " + firstNonBlank(turmaSelecionada.getNome(), "selecionada")
                : "Visao consolidada de todas as turmas"
        );

        DashboardResumoDTO.ForecastSnapshot forecast = buildForecast(monthlyFinancial, saldo);

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
            forecast
        );
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
            recommendation = "A media recente pressiona o caixa. Reforce cobrancas e segure novas despesas.";
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

    private List<DashboardResumoDTO.AlertItem> buildAlerts(long inadimplentes, long totalAlunos, double saldo, Evento proximoEvento, LocalDate hoje) {
        List<DashboardResumoDTO.AlertItem> alerts = new ArrayList<>();

        if (totalAlunos > 0 && inadimplentes > 0) {
            double percentual = round((double) inadimplentes * 100 / totalAlunos);
            alerts.add(new DashboardResumoDTO.AlertItem(
                percentual >= 30 ? "high" : "medium",
                "Inadimplencia em acompanhamento",
                "%s alunos estao pendentes ou atrasados (%s%% da base).".formatted(inadimplentes, percentual)
            ));
        }

        if (saldo < 0) {
            alerts.add(new DashboardResumoDTO.AlertItem(
                "high",
                "Saldo negativo",
                "As despesas superam as receitas. Priorize cobranca e revisao de custos."
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
        return new DashboardResumoDTO.TurmaPerformanceItem(
            turma.getId(),
            firstNonBlank(turma.getNome(), "Turma sem nome"),
            firstNonBlank(turma.getCurso(), "Curso nao informado"),
            turma.getQuantidadeAlunos(),
            round(safeDouble(turma.getTotalArrecadado())),
            firstNonBlank(turma.getStatus(), "emdia")
        );
    }

    private int calculateHealthScore(double saldo, long inadimplentes, long totalAlunos, Evento proximoEvento, LocalDate hoje) {
        int score = 82;

        if (saldo < 0) score -= 28;
        else if (saldo == 0) score -= 10;

        if (totalAlunos > 0) {
            double percentualInadimplencia = (double) inadimplentes * 100 / totalAlunos;
            if (percentualInadimplencia >= 30) score -= 22;
            else if (percentualInadimplencia >= 15) score -= 12;
        }

        if (proximoEvento == null || proximoEvento.getDataEvento() == null) {
            score -= 8;
        } else {
            long dias = ChronoUnit.DAYS.between(hoje, proximoEvento.getDataEvento());
            if (dias < 0) score -= 10;
            else if (dias <= 7) score -= 4;
        }

        return Math.max(0, Math.min(100, score));
    }

    private boolean isInadimplente(String status) {
        return "atrasado".equalsIgnoreCase(status) || "pendente".equalsIgnoreCase(status);
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
}
