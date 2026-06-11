package br.com.senac.formatura.sistema_gerenciamento_formaturas.controller;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.ContribuicaoInputDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.ContribuicaoResumoDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Aluno;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.LancamentoFinanceiro;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Perfil;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Turma;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Usuario;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.AlunoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.LancamentoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.TurmaRepository;

@RestController
@RequestMapping("/api/contribuicoes")
public class ContribuicaoController {

    private final LancamentoRepository lancamentoRepository;
    private final TurmaRepository turmaRepository;
    private final AlunoRepository alunoRepository;

    public ContribuicaoController(
        LancamentoRepository lancamentoRepository,
        TurmaRepository turmaRepository,
        AlunoRepository alunoRepository
    ) {
        this.lancamentoRepository = lancamentoRepository;
        this.turmaRepository = turmaRepository;
        this.alunoRepository = alunoRepository;
    }

    @GetMapping("/resumo")
    public ResponseEntity<ContribuicaoResumoDTO> resumo(
        @AuthenticationPrincipal Usuario usuario,
        @RequestParam(required = false) Long turmaId
    ) {
        Scope scope = resolveScope(usuario, turmaId);
        List<LancamentoFinanceiro> contribuicoes = scope.turmaId() != null
            ? lancamentoRepository.findByTurmaIdAndContribuicaoTrueOrderByDataLancamentoDescIdDesc(scope.turmaId())
            : lancamentoRepository.findByContribuicaoTrueOrderByDataLancamentoDescIdDesc();
        List<Turma> turmas = scope.turmaId() != null
            ? turmaRepository.findById(scope.turmaId()).map(List::of).orElse(List.of())
            : turmaRepository.findAll();

        double total = round(contribuicoes.stream()
            .filter(this::isConfirmada)
            .mapToDouble(item -> safe(item.getValor()))
            .sum());
        long quantidade = contribuicoes.stream().filter(this::isConfirmada).count();
        double ticketMedio = quantidade == 0 ? 0.0 : round(total / quantidade);
        double metaTotal = round(turmas.stream().mapToDouble(turma -> safe(turma.getMetaArrecadacao())).sum());
        Map<Long, Double> saldosPorTurma = summarizeSaldosTurmas(turmas);
        double totalArrecadado = round(turmas.stream().mapToDouble(turma -> saldosPorTurma.getOrDefault(turma.getId(), 0.0)).sum());
        double metaRestante = metaTotal <= 0 ? 0.0 : round(Math.max(0.0, metaTotal - totalArrecadado));
        double percentualMeta = metaTotal <= 0 ? 0.0 : round((totalArrecadado / metaTotal) * 100.0);
        Map<Long, ContributionAggregate> aggregates = summarizeByTurma(turmas);

        return ResponseEntity.ok(new ContribuicaoResumoDTO(
            new ContribuicaoResumoDTO.Summary(
                total,
                quantidade,
                ticketMedio,
                metaRestante,
                percentualMeta,
                scope.label()
            ),
            contribuicoes.stream().limit(12).map(this::toItem).toList(),
            turmas.stream()
                .sorted(Comparator.comparing(Turma::getNome, Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(turma -> toTurmaResumo(
                    turma,
                    aggregates.getOrDefault(turma.getId(), ContributionAggregate.EMPTY),
                    saldosPorTurma.getOrDefault(turma.getId(), 0.0)
                ))
                .toList()
        ));
    }

    @PostMapping
    public ResponseEntity<String> registrar(
        @AuthenticationPrincipal Usuario usuario,
        @RequestBody ContribuicaoInputDTO input
    ) {
        if (usuario == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado.");
        }

        Aluno aluno = null;
        Long turmaId = input.turmaId();
        if (usuario.getPerfil() == Perfil.ROLE_ALUNO) {
            aluno = usuario.getAluno();
        } else if (input.alunoId() != null) {
            aluno = alunoRepository.findById(input.alunoId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aluno não encontrado."));
            if (turmaId == null && aluno.getTurma() != null) {
                turmaId = aluno.getTurma().getId();
            }
        }

        Scope scope = resolveScope(usuario, turmaId);
        if (scope.turmaId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione uma turma para registrar a contribuição.");
        }
        Turma turma = turmaRepository.findById(scope.turmaId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turma não encontrada."));

        if (aluno != null && (aluno.getTurma() == null || !turma.getId().equals(aluno.getTurma().getId()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O aluno selecionado não pertence à turma da contribuição.");
        }

        double valor = round(safe(input.valor()));
        if (valor <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe um valor positivo para a contribuição.");
        }

        LancamentoFinanceiro lancamento = new LancamentoFinanceiro();
        lancamento.setTurma(turma);
        lancamento.setAluno(aluno);
        lancamento.setTipo("RECEITA");
        lancamento.setContribuicao(true);
        lancamento.setCategoria("CONTRIBUICAO");
        lancamento.setFormaPagamento(resolveOption(input.formaPagamento(), "PIX", List.of("PIX", "DINHEIRO", "BOLETO", "CARTAO", "TRANSFERENCIA", "OUTROS")));
        lancamento.setStatus(resolveOption(input.status(), "CONFIRMADO", List.of("PENDENTE", "CONFIRMADO", "CANCELADO")));
        lancamento.setCampanha(resolveOption(input.campanha(), "META_GERAL", List.of("META_GERAL", "RIFA", "PATROCINIO", "EVENTO", "OUTROS")));
        lancamento.setAnonima(Boolean.TRUE.equals(input.anonima()));
        lancamento.setValor(valor);
        lancamento.setDataLancamento(input.data());
        lancamento.setDescricao(normalize(input.titulo(), "Contribuição para a meta"));
        lancamento.setReferencia(normalize(input.mensagem(), ""));
        lancamento.setApoiadorNome(resolveApoiadorNome(usuario, input, aluno));

        lancamentoRepository.save(lancamento);
        turma.setTotalArrecadado(round(safe(lancamentoRepository.saldoByTurmaId(turma.getId()))));
        turmaRepository.save(turma);

        return ResponseEntity.ok("Contribuição registrada com sucesso.");
    }

    private Scope resolveScope(Usuario usuario, Long turmaId) {
        if (usuario == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário não autenticado.");
        }

        if (usuario.getPerfil() == Perfil.ROLE_ALUNO) {
            if (usuario.getAluno() == null || usuario.getAluno().getTurma() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Aluno sem turma vinculada.");
            }
            Long alunoTurmaId = usuario.getAluno().getTurma().getId();
            return new Scope(alunoTurmaId, "Contribuições da sua turma");
        }

        if (turmaId != null) {
            Turma turma = turmaRepository.findById(turmaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Turma não encontrada."));
            return new Scope(turma.getId(), "Contribuições da turma " + normalize(turma.getNome(), "selecionada"));
        }

        return new Scope(null, "Contribuições de todas as turmas");
    }

    private String resolveApoiadorNome(Usuario usuario, ContribuicaoInputDTO input, Aluno aluno) {
        if (Boolean.TRUE.equals(input.anonima())) {
            return "Contribuição anônima";
        }
        if (input.apoiadorNome() != null && !input.apoiadorNome().isBlank()) {
            return input.apoiadorNome().trim();
        }
        if (aluno != null && aluno.getNome() != null && !aluno.getNome().isBlank()) {
            return aluno.getNome().trim();
        }
        if (usuario != null && usuario.getAluno() != null && usuario.getAluno().getNome() != null) {
            return usuario.getAluno().getNome().trim();
        }
        return "Apoiador da turma";
    }

    private ContribuicaoResumoDTO.ContribuicaoItem toItem(LancamentoFinanceiro lancamento) {
        return new ContribuicaoResumoDTO.ContribuicaoItem(
            lancamento.getId(),
            normalize(lancamento.getDescricao(), "Contribuição"),
            round(safe(lancamento.getValor())),
            lancamento.getDataLancamento(),
            lancamento.getTurma() != null ? lancamento.getTurma().getId() : null,
            lancamento.getTurma() != null ? normalize(lancamento.getTurma().getNome(), "Sem turma") : "Sem turma",
            normalize(lancamento.getApoiadorNome(), "Apoiador da turma"),
            normalize(lancamento.getReferencia(), ""),
            normalize(lancamento.getCampanha(), "META_GERAL"),
            normalize(lancamento.getFormaPagamento(), "PIX"),
            normalize(lancamento.getStatus(), "PENDENTE"),
            Boolean.TRUE.equals(lancamento.getAnonima())
        );
    }

    private ContribuicaoResumoDTO.TurmaResumo toTurmaResumo(Turma turma, ContributionAggregate aggregate, double saldoTurma) {
        double meta = safe(turma.getMetaArrecadacao());
        double arrecadado = saldoTurma;
        double percentualMeta = meta <= 0 ? 0.0 : round((arrecadado / meta) * 100.0);
        double metaRestante = meta <= 0 ? 0.0 : round(Math.max(0.0, meta - arrecadado));

        return new ContribuicaoResumoDTO.TurmaResumo(
            turma.getId(),
            normalize(turma.getNome(), "Turma"),
            aggregate.totalContribuicoes(),
            aggregate.quantidadeContribuicoes(),
            percentualMeta,
            metaRestante
        );
    }

    private Map<Long, Double> summarizeSaldosTurmas(List<Turma> turmas) {
        Map<Long, Double> saldos = new HashMap<>();
        for (Turma turma : turmas) {
            if (turma.getId() == null) continue;
            saldos.put(turma.getId(), round(safe(lancamentoRepository.saldoByTurmaId(turma.getId()))));
        }
        return saldos;
    }

    private Map<Long, ContributionAggregate> summarizeByTurma(List<Turma> turmas) {
        List<Long> turmaIds = turmas.stream()
            .map(Turma::getId)
            .filter(id -> id != null)
            .toList();

        if (turmaIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, ContributionAggregate> aggregates = new HashMap<>();
        for (Object[] row : lancamentoRepository.resumirContribuicoesPorTurma(turmaIds)) {
            Long turmaId = (Long) row[0];
            long quantidade = ((Number) row[1]).longValue();
            double total = round(((Number) row[2]).doubleValue());
            aggregates.put(turmaId, new ContributionAggregate(quantidade, total));
        }
        return aggregates;
    }

    private String normalize(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private String resolveOption(String value, String fallback, List<String> allowed) {
        String candidate = normalize(value, fallback).toUpperCase().replace('-', '_').replace(' ', '_');
        if (allowed.contains(candidate)) {
            return candidate;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Opcao invalida: " + value);
    }

    private boolean isConfirmada(LancamentoFinanceiro lancamento) {
        return "CONFIRMADO".equalsIgnoreCase(normalize(lancamento.getStatus(), "CONFIRMADO"));
    }

    private double safe(Double value) {
        return value == null ? 0.0 : value;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private record ContributionAggregate(long quantidadeContribuicoes, double totalContribuicoes) {
        private static final ContributionAggregate EMPTY = new ContributionAggregate(0, 0.0);
    }

    private record Scope(Long turmaId, String label) {}
}
