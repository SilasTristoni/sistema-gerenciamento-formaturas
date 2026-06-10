package br.com.senac.formatura.sistema_gerenciamento_formaturas.dto;
import java.time.LocalDate;

public record LancamentoInputDTO(
    String descricao,
    String tipo,
    String categoria,
    String formaPagamento,
    String status,
    Boolean contribuicao,
    String apoiadorNome,
    Double valor,
    LocalDate data,
    LocalDate dataVencimento,
    String referencia,
    String observacao,
    String responsavelLancamento,
    String campanha,
    Boolean anonima,
    Long turmaId,
    Long alunoId // Opcional
) {}
