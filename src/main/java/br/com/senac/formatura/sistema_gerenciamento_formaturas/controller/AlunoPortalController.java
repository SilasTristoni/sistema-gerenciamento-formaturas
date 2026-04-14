package br.com.senac.formatura.sistema_gerenciamento_formaturas.controller;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.AlunoPainelResponseDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Aluno;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Evento;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.PresencaEvento;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Usuario;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Votacao;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Voto;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.AlunoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.EventoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.LancamentoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.PresencaEventoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.VotacaoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.VotoRepository;

@RestController
@RequestMapping("/api/aluno")
public class AlunoPortalController {

    private final AlunoRepository alunoRepository;
    private final EventoRepository eventoRepository;
    private final VotacaoRepository votacaoRepository;
    private final PresencaEventoRepository presencaRepository;
    private final VotoRepository votoRepository;
    private final LancamentoRepository lancamentoRepository;

    public AlunoPortalController(
        AlunoRepository alunoRepository,
        EventoRepository eventoRepository,
        VotacaoRepository votacaoRepository,
        PresencaEventoRepository presencaRepository,
        VotoRepository votoRepository,
        LancamentoRepository lancamentoRepository
    ) {
        this.alunoRepository = alunoRepository;
        this.eventoRepository = eventoRepository;
        this.votacaoRepository = votacaoRepository;
        this.presencaRepository = presencaRepository;
        this.votoRepository = votoRepository;
        this.lancamentoRepository = lancamentoRepository;
    }

    @GetMapping("/painel")
    public ResponseEntity<?> painel(@AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            return ResponseEntity.status(401).body("Usuario nao autenticado.");
        }

        if (usuario.getAluno() == null) {
            return ResponseEntity.status(403).body("Somente alunos podem acessar esta area.");
        }

        Aluno aluno = usuario.getAluno();
        Long turmaId = aluno.getTurma() != null ? aluno.getTurma().getId() : null;
        if (turmaId == null) {
            return ResponseEntity.badRequest().body("Aluno sem turma vinculada.");
        }

        LocalDate hoje = LocalDate.now();
        List<Evento> eventos = eventoRepository.findByTurmaIdOrderByDataEventoAscNomeAsc(turmaId);
        List<Votacao> votacoes = votacaoRepository.findByTurmaIdOrderByDataFimAscTituloAsc(turmaId);

        Map<Long, PresencaEvento> presencasPorEvento = presencaRepository.findAllByAlunoId(aluno.getId()).stream()
            .filter(item -> item.getEvento() != null && item.getEvento().getId() != null)
            .collect(Collectors.toMap(item -> item.getEvento().getId(), Function.identity(), (left, right) -> right));

        Map<Long, Voto> votosPorVotacao = votoRepository.findAllByAlunoId(aluno.getId()).stream()
            .filter(item -> item.getVotacao() != null && item.getVotacao().getId() != null)
            .collect(Collectors.toMap(item -> item.getVotacao().getId(), Function.identity(), (left, right) -> right));

        List<AlunoPainelResponseDTO.EventoAluno> eventosResponse = eventos.stream()
            .map(evento -> toEventoAluno(evento, presencasPorEvento.get(evento.getId()), hoje))
            .toList();

        List<AlunoPainelResponseDTO.VotacaoAluno> votacoesResponse = votacoes.stream()
            .map(votacao -> toVotacaoAluno(votacao, votosPorVotacao.get(votacao.getId()), hoje))
            .toList();

        long eventosRespondidos = eventosResponse.stream()
            .filter(evento -> !isBlank(evento.presencaStatus()) && !"pendente".equalsIgnoreCase(evento.presencaStatus()))
            .count();

        long eventosPendentes = eventosResponse.stream()
            .filter(evento -> !"confirmado".equalsIgnoreCase(evento.presencaStatus()))
            .filter(evento -> evento.data() != null && !evento.data().isBefore(hoje))
            .count();

        long votacoesAbertas = votacoesResponse.stream()
            .filter(AlunoPainelResponseDTO.VotacaoAluno::aberta)
            .count();

        long votacoesRespondidas = votacoesResponse.stream()
            .filter(AlunoPainelResponseDTO.VotacaoAluno::jaVotou)
            .count();

        AlunoPainelResponseDTO.EventoAluno proximoEvento = eventosResponse.stream()
            .filter(evento -> evento.data() != null && !evento.data().isBefore(hoje))
            .min(Comparator.comparing(AlunoPainelResponseDTO.EventoAluno::data))
            .orElseGet(() -> eventosResponse.stream().findFirst().orElse(null));

        Double valorMetaBruto = aluno.getTurma() != null ? aluno.getTurma().getMetaArrecadacao() : null;
        double valorArrecadado = roundMoney(safeDouble(lancamentoRepository.totalReceitasByTurmaId(turmaId)));
        double valorMeta = roundMoney(safeDouble(valorMetaBruto));
        double percentualAtingido = valorMeta <= 0 ? 0.0 : roundMoney((valorArrecadado / valorMeta) * 100.0);
        double valorRestante = valorMeta <= 0 ? 0.0 : roundMoney(Math.max(0.0, valorMeta - valorArrecadado));
        boolean metaDefinida = valorMeta > 0;
        boolean metaAtingida = metaDefinida && percentualAtingido >= 100.0;
        int quantidadeAlunos = (int) Math.max(alunoRepository.countByTurmaId(turmaId), 1L);
        double sugestaoContribuicaoMedia = metaDefinida ? roundMoney(valorRestante / quantidadeAlunos) : 0.0;
        String tituloMeta;
        String descricaoMeta;

        if (!metaDefinida) {
            tituloMeta = "Meta ainda nao definida";
            descricaoMeta = "A comissao ainda nao publicou uma meta financeira para a turma.";
        } else if (metaAtingida) {
            tituloMeta = "Meta atingida";
            descricaoMeta = "A turma ja bateu a meta de arrecadacao definida pela comissao.";
        } else {
            tituloMeta = "Meta em andamento";
            descricaoMeta = "Faltam "
                + formatCurrency(valorRestante)
                + " para bater a meta. Como referencia opcional, isso representa em media "
                + formatCurrency(sugestaoContribuicaoMedia)
                + " por participante.";
        }

        return ResponseEntity.ok(new AlunoPainelResponseDTO(
            new AlunoPainelResponseDTO.PerfilAluno(
                aluno.getId(),
                aluno.getNome(),
                aluno.getIdentificador(),
                aluno.getContato(),
                aluno.getTurma() != null ? firstNonBlank(aluno.getTurma().getNome(), "Sem turma") : "Sem turma",
                aluno.getTurma() != null ? firstNonBlank(aluno.getTurma().getCurso(), "Curso nao informado") : "Curso nao informado"
            ),
            new AlunoPainelResponseDTO.ResumoAluno(
                eventosResponse.size(),
                eventosRespondidos,
                eventosPendentes,
                votacoesAbertas,
                votacoesRespondidas
            ),
            new AlunoPainelResponseDTO.ProgressoFinanceiro(
                valorArrecadado,
                valorMeta,
                percentualAtingido,
                valorRestante,
                metaDefinida,
                metaAtingida,
                sugestaoContribuicaoMedia,
                tituloMeta,
                descricaoMeta
            ),
            proximoEvento,
            eventosResponse,
            votacoesResponse
        ));
    }

    private AlunoPainelResponseDTO.EventoAluno toEventoAluno(Evento evento, PresencaEvento presenca, LocalDate hoje) {
        LocalDate data = evento.getDataEvento();
        return new AlunoPainelResponseDTO.EventoAluno(
            evento.getId(),
            firstNonBlank(evento.getNome(), "Evento sem nome"),
            data,
            firstNonBlank(evento.getLocalEvento(), "Local a definir"),
            firstNonBlank(evento.getStatus(), "agendado"),
            presenca != null ? firstNonBlank(presenca.getStatus(), "pendente") : "pendente",
            data == null ? -1 : ChronoUnit.DAYS.between(hoje, data)
        );
    }

    private AlunoPainelResponseDTO.VotacaoAluno toVotacaoAluno(Votacao votacao, Voto voto, LocalDate hoje) {
        LocalDate dataFim = votacao.getDataFim();
        boolean aberta = isVotacaoAberta(votacao, hoje);

        return new AlunoPainelResponseDTO.VotacaoAluno(
            votacao.getId(),
            firstNonBlank(votacao.getTitulo(), "Votacao sem titulo"),
            firstNonBlank(votacao.getStatus(), aberta ? "aberta" : "encerrada"),
            dataFim,
            aberta,
            voto != null,
            voto != null && voto.getOpcao() != null ? voto.getOpcao().getId() : null,
            voto != null && voto.getOpcao() != null ? firstNonBlank(voto.getOpcao().getNomeFornecedor(), "Opcao selecionada") : "",
            dataFim == null ? -1 : ChronoUnit.DAYS.between(hoje, dataFim),
            votacao.getOpcoes() == null ? List.of() : votacao.getOpcoes().stream()
                .map(opcao -> new AlunoPainelResponseDTO.OpcaoAluno(
                    opcao.getId(),
                    firstNonBlank(opcao.getNomeFornecedor(), "Opcao sem nome")
                ))
                .toList()
        );
    }

    private boolean isVotacaoAberta(Votacao votacao, LocalDate hoje) {
        boolean statusAberto = !"encerrada".equalsIgnoreCase(votacao.getStatus());
        boolean prazoValido = votacao.getDataFim() == null || !votacao.getDataFim().isBefore(hoje);
        return statusAberto && prazoValido;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (!isBlank(value)) {
                return value;
            }
        }
        return "";
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private double safeDouble(Double value) {
        return value == null ? 0.0 : value;
    }

    private double roundMoney(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private String formatCurrency(double value) {
        return "R$ %.2f".formatted(value).replace('.', ',');
    }
}
