package br.com.senac.formatura.sistema_gerenciamento_formaturas.dto;

public record AlunoInputDTO(
    String nome, 
    String contato, 
    Long turmaId,
    String perfil 
) {}