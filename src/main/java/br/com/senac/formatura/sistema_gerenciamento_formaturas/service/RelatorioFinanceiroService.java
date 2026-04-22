package br.com.senac.formatura.sistema_gerenciamento_formaturas.service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.text.DateFormatSymbols;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.RelatorioFinanceiroDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.LancamentoFinanceiro;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Turma;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.LancamentoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.TurmaRepository;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

@Service
public class RelatorioFinanceiroService {

    private static final Locale LOCALE_PT_BR = Locale.forLanguageTag("pt-BR");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final LancamentoRepository lancamentoRepository;
    private final TurmaRepository turmaRepository;

    public RelatorioFinanceiroService(
        LancamentoRepository lancamentoRepository,
        TurmaRepository turmaRepository
    ) {
        this.lancamentoRepository = lancamentoRepository;
        this.turmaRepository = turmaRepository;
    }

    public RelatorioFinanceiroDTO gerarRelatorio(Long turmaId, Integer periodoMeses) {
        LocalDate hoje = LocalDate.now();
        int periodMonths = normalizePeriod(periodoMeses);
        List<Turma> todasTurmas = turmaRepository.findAll();
        Turma turmaSelecionada = resolveTurma(turmaId, todasTurmas);
        List<Turma> turmasEscopo = turmaSelecionada != null ? List.of(turmaSelecionada) : todasTurmas;
        List<LancamentoFinanceiro> lancamentosEscopo = filterByTurma(lancamentoRepository.findAll(), turmaId);
        List<LancamentoFinanceiro> lancamentosPeriodo = filterByPeriod(lancamentosEscopo, periodMonths, hoje);

        double receitasPeriodo = totalByTipo(lancamentosPeriodo, "receita");
        double despesasPeriodo = totalByTipo(lancamentosPeriodo, "despesa");
        double saldoPeriodo = round(receitasPeriodo - despesasPeriodo);
        double saldoAtualEscopo = round(totalByTipo(lancamentosEscopo, "receita") - totalByTipo(lancamentosEscopo, "despesa"));
        double totalContribuicoesPeriodo = round(lancamentosPeriodo.stream()
            .filter(item -> Boolean.TRUE.equals(item.getContribuicao()))
            .mapToDouble(item -> safe(item.getValor()))
            .sum());
        double participacaoContribuicoes = receitasPeriodo <= 0
            ? 0.0
            : round((totalContribuicoesPeriodo / receitasPeriodo) * 100.0);
        long totalLancamentosPeriodo = lancamentosPeriodo.size();
        double maiorReceitaPeriodo = round(lancamentosPeriodo.stream()
            .filter(item -> isTipo(item, "receita"))
            .mapToDouble(item -> safe(item.getValor()))
            .max()
            .orElse(0.0));
        double maiorDespesaPeriodo = round(lancamentosPeriodo.stream()
            .filter(item -> isTipo(item, "despesa"))
            .mapToDouble(item -> safe(item.getValor()))
            .max()
            .orElse(0.0));

        List<RelatorioFinanceiroDTO.MonthlyIndicator> indicadoresMensais = buildMonthlyIndicators(lancamentosEscopo, periodMonths, hoje);
        double mediaMensalReceitas = round(indicadoresMensais.stream()
            .mapToDouble(RelatorioFinanceiroDTO.MonthlyIndicator::receitas)
            .average()
            .orElse(0.0));
        double mediaMensalDespesas = round(indicadoresMensais.stream()
            .mapToDouble(RelatorioFinanceiroDTO.MonthlyIndicator::despesas)
            .average()
            .orElse(0.0));
        double resultadoMedioMensal = round(mediaMensalReceitas - mediaMensalDespesas);
        double coberturaCaixaMeses = mediaMensalDespesas <= 0
            ? 0.0
            : round(Math.max(0.0, saldoAtualEscopo) / mediaMensalDespesas);

        RelatorioFinanceiroDTO.FilterSnapshot filters = new RelatorioFinanceiroDTO.FilterSnapshot(
            turmaSelecionada != null ? turmaSelecionada.getId() : null,
            turmaSelecionada != null ? firstNonBlank(turmaSelecionada.getNome(), "Turma selecionada") : "Todas as turmas",
            periodMonths,
            turmaSelecionada != null
                ? "Leitura detalhada da turma " + firstNonBlank(turmaSelecionada.getNome(), "selecionada")
                : "Leitura consolidada de arrecadacao e fluxo financeiro"
        );

        RelatorioFinanceiroDTO.SummarySnapshot summary = new RelatorioFinanceiroDTO.SummarySnapshot(
            saldoAtualEscopo,
            saldoPeriodo,
            receitasPeriodo,
            despesasPeriodo,
            totalContribuicoesPeriodo,
            participacaoContribuicoes,
            mediaMensalReceitas,
            mediaMensalDespesas,
            resultadoMedioMensal,
            coberturaCaixaMeses,
            totalLancamentosPeriodo,
            maiorReceitaPeriodo,
            maiorDespesaPeriodo
        );

        List<RelatorioFinanceiroDTO.TurmaIndicator> topTurmas = turmasEscopo.stream()
            .sorted(Comparator
                .comparing(this::percentualMetaTurma, Comparator.reverseOrder())
                .thenComparing(Turma::getTotalArrecadado, Comparator.nullsLast(Comparator.reverseOrder())))
            .limit(5)
            .map(this::toTurmaIndicator)
            .toList();

        List<RelatorioFinanceiroDTO.TransactionItem> recentTransactions = lancamentosPeriodo.stream()
            .sorted(Comparator.comparing(
                LancamentoFinanceiro::getDataLancamento,
                Comparator.nullsLast(Comparator.reverseOrder())
            ).thenComparing(LancamentoFinanceiro::getId, Comparator.nullsLast(Comparator.reverseOrder())))
            .limit(12)
            .map(this::toTransactionItem)
            .toList();

        List<RelatorioFinanceiroDTO.InsightItem> insights = buildInsights(
            summary,
            filters,
            topTurmas,
            indicadoresMensais
        );

        return new RelatorioFinanceiroDTO(
            LocalDateTime.now(),
            filters,
            summary,
            indicadoresMensais,
            topTurmas,
            recentTransactions,
            insights
        );
    }

    public byte[] exportarResumoCsv(Long turmaId, Integer periodoMeses) {
        RelatorioFinanceiroDTO report = gerarRelatorio(turmaId, periodoMeses);
        StringBuilder csv = new StringBuilder();
        csv.append("secao,indicador,valor\n");
        appendCsvRow(csv, "resumo", "escopo", report.filters().scopeLabel());
        appendCsvRow(csv, "resumo", "turma", report.filters().turmaNome());
        appendCsvRow(csv, "resumo", "periodo_meses", report.filters().periodMonths());
        appendCsvRow(csv, "resumo", "saldo_atual_escopo", report.summary().saldoAtualEscopo());
        appendCsvRow(csv, "resumo", "saldo_periodo", report.summary().saldoPeriodo());
        appendCsvRow(csv, "resumo", "receitas_periodo", report.summary().receitasPeriodo());
        appendCsvRow(csv, "resumo", "despesas_periodo", report.summary().despesasPeriodo());
        appendCsvRow(csv, "resumo", "total_contribuicoes_periodo", report.summary().totalContribuicoesPeriodo());
        appendCsvRow(csv, "resumo", "participacao_contribuicoes_receita", report.summary().participacaoContribuicoesReceita());
        appendCsvRow(csv, "resumo", "media_mensal_receitas", report.summary().mediaMensalReceitas());
        appendCsvRow(csv, "resumo", "media_mensal_despesas", report.summary().mediaMensalDespesas());
        appendCsvRow(csv, "resumo", "resultado_medio_mensal", report.summary().resultadoMedioMensal());
        appendCsvRow(csv, "resumo", "cobertura_caixa_meses", report.summary().coberturaCaixaMeses());
        appendCsvRow(csv, "resumo", "total_lancamentos_periodo", report.summary().totalLancamentosPeriodo());

        csv.append("\nmensal,mes,receitas,despesas,contribuicoes,saldo\n");
        for (RelatorioFinanceiroDTO.MonthlyIndicator item : report.monthlyIndicators()) {
            appendCsvRow(csv, "mensal", item.monthLabel(), item.receitas(), item.despesas(), item.contribuicoes(), item.saldo());
        }

        csv.append("\nturmas,nome,curso,total_arrecadado,meta_arrecadacao,percentual_meta,status\n");
        for (RelatorioFinanceiroDTO.TurmaIndicator turma : report.topTurmas()) {
            appendCsvRow(
                csv,
                "turmas",
                turma.nome(),
                turma.curso(),
                turma.totalArrecadado(),
                turma.metaArrecadacao(),
                turma.percentualMeta(),
                turma.status()
            );
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] exportarLancamentosCsv(Long turmaId, Integer periodoMeses) {
        List<LancamentoFinanceiro> lancamentos = listarLancamentosDoPeriodo(turmaId, periodoMeses);
        StringBuilder csv = new StringBuilder();
        csv.append("id,data,descricao,tipo,valor,contribuicao,turma,referencia,apoiador\n");
        for (RelatorioFinanceiroDTO.TransactionItem item : lancamentos.stream()
            .sorted(Comparator.comparing(
                LancamentoFinanceiro::getDataLancamento,
                Comparator.nullsLast(Comparator.reverseOrder())
            ).thenComparing(LancamentoFinanceiro::getId, Comparator.nullsLast(Comparator.reverseOrder())))
            .map(this::toTransactionItem)
            .toList()) {
            appendCsvRow(
                csv,
                item.id(),
                item.data() != null ? item.data().format(DATE_FORMATTER) : "",
                item.descricao(),
                item.tipo(),
                item.valor(),
                item.contribuicao(),
                item.turmaNome(),
                item.referencia(),
                item.apoiadorNome()
            );
        }
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] exportarResumoPdf(Long turmaId, Integer periodoMeses) {
        RelatorioFinanceiroDTO report = gerarRelatorio(turmaId, periodoMeses);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        Document document = new Document();

        try {
            PdfWriter.getInstance(document, output);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);

            document.add(new Paragraph("Relatorio financeiro e de arrecadacao", titleFont));
            document.add(new Paragraph(
                "%s | %s | janela de %d meses".formatted(
                    report.filters().scopeLabel(),
                    report.filters().turmaNome(),
                    report.filters().periodMonths()
                ),
                subtitleFont
            ));
            document.add(new Paragraph("Gerado em " + report.generatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")), subtitleFont));
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Resumo executivo", sectionFont));
            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(100);
            summaryTable.setSpacingBefore(8f);
            addSummaryRow(summaryTable, "Saldo atual do escopo", formatCurrency(report.summary().saldoAtualEscopo()));
            addSummaryRow(summaryTable, "Resultado do periodo", formatCurrency(report.summary().saldoPeriodo()));
            addSummaryRow(summaryTable, "Receitas do periodo", formatCurrency(report.summary().receitasPeriodo()));
            addSummaryRow(summaryTable, "Despesas do periodo", formatCurrency(report.summary().despesasPeriodo()));
            addSummaryRow(summaryTable, "Contribuicoes no periodo", formatCurrency(report.summary().totalContribuicoesPeriodo()));
            addSummaryRow(summaryTable, "Participacao das contribuicoes", formatPercent(report.summary().participacaoContribuicoesReceita()));
            addSummaryRow(summaryTable, "Resultado medio mensal", formatCurrency(report.summary().resultadoMedioMensal()));
            addSummaryRow(summaryTable, "Cobertura de caixa", report.summary().coberturaCaixaMeses() > 0
                ? formatDecimal(report.summary().coberturaCaixaMeses()) + " meses"
                : "Sem base suficiente");
            document.add(summaryTable);

            document.add(new Paragraph(" "));
            document.add(new Paragraph("Indicadores mensais", sectionFont));
            PdfPTable monthlyTable = new PdfPTable(5);
            monthlyTable.setWidthPercentage(100);
            monthlyTable.setSpacingBefore(8f);
            addHeaderCell(monthlyTable, "Mes");
            addHeaderCell(monthlyTable, "Receitas");
            addHeaderCell(monthlyTable, "Despesas");
            addHeaderCell(monthlyTable, "Contribuicoes");
            addHeaderCell(monthlyTable, "Saldo");
            for (RelatorioFinanceiroDTO.MonthlyIndicator item : report.monthlyIndicators()) {
                addBodyCell(monthlyTable, item.monthLabel());
                addBodyCell(monthlyTable, formatCurrency(item.receitas()));
                addBodyCell(monthlyTable, formatCurrency(item.despesas()));
                addBodyCell(monthlyTable, formatCurrency(item.contribuicoes()));
                addBodyCell(monthlyTable, formatCurrency(item.saldo()));
            }
            document.add(monthlyTable);

            document.add(new Paragraph(" "));
            document.add(new Paragraph("Leituras estrategicas", sectionFont));
            for (RelatorioFinanceiroDTO.InsightItem insight : report.insights()) {
                document.add(new Paragraph(
                    "- " + insight.title() + ": " + insight.description(),
                    subtitleFont
                ));
            }
        } catch (DocumentException exception) {
            throw new IllegalStateException("Nao foi possivel gerar o PDF do relatorio.", exception);
        } finally {
            document.close();
        }

        return output.toByteArray();
    }

    private List<RelatorioFinanceiroDTO.MonthlyIndicator> buildMonthlyIndicators(
        List<LancamentoFinanceiro> lancamentos,
        int periodMonths,
        LocalDate hoje
    ) {
        YearMonth currentMonth = YearMonth.from(hoje);
        YearMonth startMonth = currentMonth.minusMonths(periodMonths - 1L);
        Map<YearMonth, double[]> grouped = new LinkedHashMap<>();

        for (int index = 0; index < periodMonths; index++) {
            grouped.put(startMonth.plusMonths(index), new double[3]);
        }

        lancamentos.stream()
            .filter(item -> item.getDataLancamento() != null)
            .forEach(item -> {
                YearMonth month = YearMonth.from(item.getDataLancamento());
                if (month.isBefore(startMonth) || month.isAfter(currentMonth)) return;

                double[] values = grouped.computeIfAbsent(month, key -> new double[3]);
                if (isTipo(item, "receita")) {
                    values[0] += safe(item.getValor());
                    if (Boolean.TRUE.equals(item.getContribuicao())) {
                        values[2] += safe(item.getValor());
                    }
                } else {
                    values[1] += safe(item.getValor());
                }
            });

        return grouped.entrySet().stream()
            .map(entry -> new RelatorioFinanceiroDTO.MonthlyIndicator(
                "%d-%02d".formatted(entry.getKey().getYear(), entry.getKey().getMonthValue()),
                abbreviateMonth(entry.getKey().getMonthValue()) + "/" + String.valueOf(entry.getKey().getYear()).substring(2),
                round(entry.getValue()[0]),
                round(entry.getValue()[1]),
                round(entry.getValue()[2]),
                round(entry.getValue()[0] - entry.getValue()[1])
            ))
            .toList();
    }

    private List<LancamentoFinanceiro> listarLancamentosDoPeriodo(Long turmaId, Integer periodoMeses) {
        LocalDate hoje = LocalDate.now();
        int periodMonths = normalizePeriod(periodoMeses);
        List<LancamentoFinanceiro> lancamentosEscopo = filterByTurma(lancamentoRepository.findAll(), turmaId);
        return filterByPeriod(lancamentosEscopo, periodMonths, hoje);
    }

    private List<RelatorioFinanceiroDTO.InsightItem> buildInsights(
        RelatorioFinanceiroDTO.SummarySnapshot summary,
        RelatorioFinanceiroDTO.FilterSnapshot filters,
        List<RelatorioFinanceiroDTO.TurmaIndicator> topTurmas,
        List<RelatorioFinanceiroDTO.MonthlyIndicator> monthlyIndicators
    ) {
        List<RelatorioFinanceiroDTO.InsightItem> insights = new ArrayList<>();

        if (summary.despesasPeriodo() > summary.receitasPeriodo()) {
            insights.add(new RelatorioFinanceiroDTO.InsightItem(
                "warning",
                "Periodo com pressao no caixa",
                "As despesas do recorte analisado superaram as receitas. Vale segurar novas saidas e reforcar a campanha de arrecadacao."
            ));
        } else {
            insights.add(new RelatorioFinanceiroDTO.InsightItem(
                "success",
                "Resultado operacional positivo",
                "O periodo fechou com saldo favoravel, o que abre espaco para planejar reservas e proximos compromissos."
            ));
        }

        if (summary.participacaoContribuicoesReceita() < 40.0) {
            insights.add(new RelatorioFinanceiroDTO.InsightItem(
                "info",
                "Campanha de contribuicao ainda pouco dominante",
                "As contribuicoes representam " + formatPercent(summary.participacaoContribuicoesReceita())
                    + " das receitas do periodo. Ha espaco para aumentar engajamento na arrecadacao."
            ));
        } else {
            insights.add(new RelatorioFinanceiroDTO.InsightItem(
                "success",
                "Arrecadacao com boa participacao",
                "As contribuicoes ja respondem por " + formatPercent(summary.participacaoContribuicoesReceita())
                    + " das entradas do periodo, sinalizando boa adesao da turma."
            ));
        }

        if (summary.coberturaCaixaMeses() > 0 && summary.coberturaCaixaMeses() < 2.0) {
            insights.add(new RelatorioFinanceiroDTO.InsightItem(
                "warning",
                "Cobertura de caixa curta",
                "No ritmo atual de despesas, o saldo cobre aproximadamente " + formatDecimal(summary.coberturaCaixaMeses())
                    + " meses. E recomendavel reforcar entradas antes de assumir novos custos."
            ));
        }

        RelatorioFinanceiroDTO.TurmaIndicator destaque = topTurmas.stream().findFirst().orElse(null);
        if (destaque != null) {
            insights.add(new RelatorioFinanceiroDTO.InsightItem(
                "info",
                "Turma em destaque",
                destaque.nome() + " lidera este recorte com " + formatCurrency(destaque.totalArrecadado())
                    + " arrecadados e " + formatPercent(destaque.percentualMeta()) + " da meta atingida."
            ));
        }

        RelatorioFinanceiroDTO.MonthlyIndicator melhorMes = monthlyIndicators.stream()
            .max(Comparator.comparing(RelatorioFinanceiroDTO.MonthlyIndicator::saldo))
            .orElse(null);
        if (melhorMes != null) {
            insights.add(new RelatorioFinanceiroDTO.InsightItem(
                "info",
                "Melhor mes do recorte",
                melhorMes.monthLabel() + " fechou com saldo de " + formatCurrency(melhorMes.saldo())
                    + " dentro do escopo " + filters.turmaNome() + "."
            ));
        }

        return insights;
    }

    private RelatorioFinanceiroDTO.TurmaIndicator toTurmaIndicator(Turma turma) {
        double totalArrecadado = round(safe(turma.getTotalArrecadado()));
        double meta = round(safe(turma.getMetaArrecadacao()));
        double percentualMeta = meta <= 0 ? 0.0 : round((totalArrecadado / meta) * 100.0);

        return new RelatorioFinanceiroDTO.TurmaIndicator(
            turma.getId(),
            firstNonBlank(turma.getNome(), "Turma"),
            firstNonBlank(turma.getCurso(), "Curso nao informado"),
            turma.getQuantidadeAlunos(),
            totalArrecadado,
            meta,
            percentualMeta,
            firstNonBlank(turma.getStatus(), "emdia")
        );
    }

    private RelatorioFinanceiroDTO.TransactionItem toTransactionItem(LancamentoFinanceiro lancamento) {
        return new RelatorioFinanceiroDTO.TransactionItem(
            lancamento.getId(),
            lancamento.getDataLancamento(),
            firstNonBlank(lancamento.getDescricao(), "Lancamento"),
            firstNonBlank(lancamento.getTipo(), "despesa"),
            round(safe(lancamento.getValor())),
            Boolean.TRUE.equals(lancamento.getContribuicao()),
            lancamento.getTurma() != null ? firstNonBlank(lancamento.getTurma().getNome(), "Sem turma") : "Sem turma",
            firstNonBlank(lancamento.getReferencia(), ""),
            firstNonBlank(lancamento.getApoiadorNome(), "")
        );
    }

    private List<LancamentoFinanceiro> filterByTurma(List<LancamentoFinanceiro> lancamentos, Long turmaId) {
        if (turmaId == null) return lancamentos;
        return lancamentos.stream()
            .filter(item -> item.getTurma() != null && turmaId.equals(item.getTurma().getId()))
            .toList();
    }

    private List<LancamentoFinanceiro> filterByPeriod(List<LancamentoFinanceiro> lancamentos, int periodMonths, LocalDate hoje) {
        LocalDate startDate = YearMonth.from(hoje).minusMonths(periodMonths - 1L).atDay(1);
        return lancamentos.stream()
            .filter(item -> item.getDataLancamento() != null && !item.getDataLancamento().isBefore(startDate))
            .toList();
    }

    private Turma resolveTurma(Long turmaId, List<Turma> turmas) {
        if (turmaId == null) return null;

        return turmas.stream()
            .filter(turma -> turmaId.equals(turma.getId()))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turma nao encontrada."));
    }

    private double totalByTipo(List<LancamentoFinanceiro> lancamentos, String tipo) {
        return round(lancamentos.stream()
            .filter(item -> isTipo(item, tipo))
            .mapToDouble(item -> safe(item.getValor()))
            .sum());
    }

    private boolean isTipo(LancamentoFinanceiro item, String tipo) {
        return item.getTipo() != null && item.getTipo().equalsIgnoreCase(tipo);
    }

    private double percentualMetaTurma(Turma turma) {
        double meta = safe(turma.getMetaArrecadacao());
        if (meta <= 0) return 0.0;
        return round((safe(turma.getTotalArrecadado()) / meta) * 100.0);
    }

    private int normalizePeriod(Integer periodMonths) {
        if (periodMonths == null) return 6;
        return Math.max(1, Math.min(12, periodMonths));
    }

    private double safe(Double value) {
        return value == null ? 0.0 : value;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }

    private String abbreviateMonth(int month) {
        String[] months = new DateFormatSymbols(LOCALE_PT_BR).getShortMonths();
        if (month < 1 || month > 12) return "--";
        return months[month - 1].replace(".", "").toLowerCase(LOCALE_PT_BR);
    }

    private String formatCurrency(double value) {
        return "R$ %.2f".formatted(value).replace('.', ',');
    }

    private String formatPercent(double value) {
        return "%.1f%%".formatted(value).replace('.', ',');
    }

    private String formatDecimal(double value) {
        return "%.1f".formatted(value).replace('.', ',');
    }

    private void appendCsvRow(StringBuilder builder, Object... columns) {
        for (int index = 0; index < columns.length; index++) {
            if (index > 0) builder.append(',');
            String value = columns[index] == null ? "" : String.valueOf(columns[index]);
            builder.append('"').append(value.replace("\"", "\"\"")).append('"');
        }
        builder.append('\n');
    }

    private void addSummaryRow(PdfPTable table, String label, String value) {
        addBodyCell(table, label);
        addBodyCell(table, value);
    }

    private void addHeaderCell(PdfPTable table, String value) {
        PdfPCell cell = new PdfPCell(new Phrase(value, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
        cell.setPadding(6f);
        table.addCell(cell);
    }

    private void addBodyCell(PdfPTable table, String value) {
        PdfPCell cell = new PdfPCell(new Phrase(value, FontFactory.getFont(FontFactory.HELVETICA, 9)));
        cell.setPadding(6f);
        table.addCell(cell);
    }
}
