package br.com.senac.formatura.sistema_gerenciamento_formaturas.dto;
import java.time.LocalDate;

public record LancamentoInputDTO(
    String descricao,
    String tipo,
    Double valor,
    LocalDate data,
    String referencia,
    Long turmaId,
    Long alunoId // Opcional
) {}