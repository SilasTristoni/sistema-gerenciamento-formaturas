package br.com.senac.formatura.sistema_gerenciamento_formaturas.dto;
import java.time.LocalDate;

public record TarefaInputDTO(
    String titulo,
    String descricao,
    LocalDate dataLimite,
    Long turmaId,
    Long responsavelId
) {}