package br.com.senac.formatura.sistema_gerenciamento_formaturas.dto;

import java.time.LocalDate;

public record ContribuicaoInputDTO(
    String titulo,
    Double valor,
    LocalDate data,
    String mensagem,
    String campanha,
    String formaPagamento,
    String status,
    Long turmaId,
    Long alunoId,
    String apoiadorNome,
    Boolean anonima
) {}
