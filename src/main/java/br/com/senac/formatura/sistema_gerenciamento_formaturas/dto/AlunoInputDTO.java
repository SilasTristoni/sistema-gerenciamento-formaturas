package br.com.senac.formatura.sistema_gerenciamento_formaturas.dto;

// Record: uma forma moderna e concisa de criar classes imutáveis para transporte de dados (Java 16+)
public record AlunoInputDTO(
    String nome, 
    String contato, 
    Long turmaId
) {}