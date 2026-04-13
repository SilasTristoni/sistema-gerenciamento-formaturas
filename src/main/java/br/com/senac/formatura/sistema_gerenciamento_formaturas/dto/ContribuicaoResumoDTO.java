package br.com.senac.formatura.sistema_gerenciamento_formaturas.dto;

import java.time.LocalDate;
import java.util.List;

public record ContribuicaoResumoDTO(
    Summary summary,
    List<ContribuicaoItem> recentes,
    List<TurmaResumo> turmas
) {
    public record Summary(
        double totalContribuicoes,
        long quantidadeContribuicoes,
        double ticketMedio,
        double metaRestante,
        double percentualMeta,
        String scopeLabel
    ) {}

    public record ContribuicaoItem(
        Long id,
        String titulo,
        double valor,
        LocalDate data,
        Long turmaId,
        String turmaNome,
        String apoiadorNome,
        String mensagem
    ) {}

    public record TurmaResumo(
        Long turmaId,
        String turmaNome,
        double totalContribuicoes,
        long quantidadeContribuicoes,
        double percentualMeta,
        double metaRestante
    ) {}
}
