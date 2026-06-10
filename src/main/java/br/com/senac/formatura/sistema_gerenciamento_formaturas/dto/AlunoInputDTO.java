package br.com.senac.formatura.sistema_gerenciamento_formaturas.dto;

public record AlunoInputDTO(
    String nome,
    String identificador,
    String email,
    String whatsapp,
    String contato,
    Long turmaId,
    String status,
    String observacaoInterna,
    String perfil,
    String senha
) {}
