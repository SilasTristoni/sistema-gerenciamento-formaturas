package br.com.senac.formatura.sistema_gerenciamento_formaturas.dto;

import java.time.LocalDate;
import java.util.List;

public record AlunoPainelResponseDTO(
    PerfilAluno aluno,
    ResumoAluno resumo,
    ProgressoFinanceiro financeiro,
    EventoAluno proximoEvento,
    List<EventoAluno> eventos,
    List<VotacaoAluno> votacoes
    ) {
    public record PerfilAluno(
        Long alunoId,
        String nome,
        String identificador,
        String contato,
        String email,
        String whatsapp,
        String status,
        boolean precisaTrocarSenha,
        String turmaNome,
        String curso,
        String instituicao,
        String anoSemestre
    ) {}

    public record ResumoAluno(
        long totalEventos,
        long eventosComPresencaRespondida,
        long eventosPendentesConfirmacao,
        long votacoesAbertas,
        long votacoesRespondidas
    ) {}

    public record ProgressoFinanceiro(
        double valorArrecadado,
        double valorMeta,
        double percentualAtingido,
        double valorRestante,
        boolean metaDefinida,
        boolean metaAtingida,
        double sugestaoContribuicaoMedia,
        String titulo,
        String descricao
    ) {}

    public record EventoAluno(
        Long id,
        String nome,
        LocalDate data,
        String local,
        String horario,
        String tipo,
        String responsavel,
        String status,
        String presencaStatus,
        long diasRestantes
    ) {}

    public record VotacaoAluno(
        Long id,
        String titulo,
        String descricao,
        String status,
        LocalDate dataInicio,
        LocalDate dataFim,
        boolean aberta,
        boolean jaVotou,
        Long opcaoSelecionadaId,
        String opcaoSelecionadaNome,
        long diasRestantes,
        long totalVotos,
        List<OpcaoAluno> opcoes
    ) {}

    public record OpcaoAluno(
        Long id,
        String nome,
        String descricao,
        long votos,
        double percentual
    ) {}
}
