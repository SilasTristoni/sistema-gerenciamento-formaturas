package br.com.senac.formatura.sistema_gerenciamento_formaturas.dto;

public record AlunoInputDTO(
    String nome,
    String identificador,
    String contato,
    Long turmaId,
    String perfil,
    String senha
) {}
