package br.com.senac.formatura.sistema_gerenciamento_formaturas.dto;

public record VotoAlunoLogadoRequestDTO(
    Long votacaoId,
    Long opcaoId
) {}