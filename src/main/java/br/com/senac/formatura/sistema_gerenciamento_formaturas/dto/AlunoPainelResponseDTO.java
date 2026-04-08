package br.com.senac.formatura.sistema_gerenciamento_formaturas.dto;

import java.time.LocalDate;
import java.util.List;

public record AlunoPainelResponseDTO(
    PerfilAluno aluno,
    ResumoAluno resumo,
    EventoAluno proximoEvento,
    List<EventoAluno> eventos,
    List<VotacaoAluno> votacoes
) {
    public record PerfilAluno(
        Long alunoId,
        String nome,
        String identificador,
        String contato,
        String statusFinanceiro,
        String turmaNome,
        String curso
    ) {}

    public record ResumoAluno(
        long totalEventos,
        long eventosComPresencaRespondida,
        long eventosPendentesConfirmacao,
        long votacoesAbertas,
        long votacoesRespondidas
    ) {}

    public record EventoAluno(
        Long id,
        String nome,
        LocalDate data,
        String local,
        String status,
        String presencaStatus,
        long diasRestantes
    ) {}

    public record VotacaoAluno(
        Long id,
        String titulo,
        String status,
        LocalDate dataFim,
        boolean aberta,
        boolean jaVotou,
        Long opcaoSelecionadaId,
        String opcaoSelecionadaNome,
        long diasRestantes,
        List<OpcaoAluno> opcoes
    ) {}

    public record OpcaoAluno(
        Long id,
        String nome
    ) {}
}
