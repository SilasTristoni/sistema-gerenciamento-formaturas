package br.com.senac.formatura.sistema_gerenciamento_formaturas.dto;

import java.time.LocalDate;

public record EventoResumoDTO(
    Long id,
    String nome,
    LocalDate dataEvento,
    String localEvento,
    String status,
    TurmaResumo turma,
    long presencas,
    long talvez,
    long faltas,
    long pendentes
) {
    public record TurmaResumo(
        Long id,
        String nome
    ) {}
}
