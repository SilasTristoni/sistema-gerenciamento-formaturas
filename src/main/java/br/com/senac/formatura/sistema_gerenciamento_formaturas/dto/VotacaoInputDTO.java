package br.com.senac.formatura.sistema_gerenciamento_formaturas.dto;
import java.time.LocalDate;

public record VotacaoInputDTO(
    String titulo,
    String descricao,
    LocalDate dataInicio,
    LocalDate dataFim,
    Long turmaId,
    String status,
    String tipo,
    String visibilidadeResultado,
    Boolean anonima,
    Integer quorumMinimo
) {}
