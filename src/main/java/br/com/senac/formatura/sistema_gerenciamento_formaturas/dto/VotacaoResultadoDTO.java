package br.com.senac.formatura.sistema_gerenciamento_formaturas.dto;

import java.time.LocalDate;
import java.util.List;

public record VotacaoResultadoDTO(
    Long id,
    String titulo,
    String status,
    LocalDate dataFim,
    TurmaResumo turma,
    long totalVotos,
    List<OpcaoResultadoDTO> opcoes
) {
    public record TurmaResumo(
        Long id,
        String nome
    ) {}

    public record OpcaoResultadoDTO(
        Long id,
        String nomeFornecedor,
        String detalhesProposta,
        Double valorProposta,
        long votos,
        double percentual
    ) {}
}
