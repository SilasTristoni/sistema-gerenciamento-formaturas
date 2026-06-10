package br.com.senac.formatura.sistema_gerenciamento_formaturas.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record EventoResumoDTO(
    Long id,
    String nome,
    String descricao,
    LocalDate dataEvento,
    LocalTime horario,
    String localEvento,
    String tipo,
    String responsavel,
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
