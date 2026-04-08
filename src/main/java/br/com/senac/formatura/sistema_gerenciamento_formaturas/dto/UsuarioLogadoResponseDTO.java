package br.com.senac.formatura.sistema_gerenciamento_formaturas.dto;

public record UsuarioLogadoResponseDTO(
    Long usuarioId,
    String nome,
    String email,
    String login,
    String perfil,
    Long alunoId
) {}
