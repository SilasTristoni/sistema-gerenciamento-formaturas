package br.com.senac.formatura.sistema_gerenciamento_formaturas.controller;

import java.time.LocalDate;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.VotoAlunoLogadoRequestDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Aluno;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.OpcaoVotacao;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Usuario;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Votacao;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Voto;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.OpcaoVotacaoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.VotacaoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.VotoRepository;

@RestController
@RequestMapping("/api/votacoes")
public class VotacaoSeguraController {

    private final VotacaoRepository votacaoRepo;
    private final OpcaoVotacaoRepository opcaoRepo;
    private final VotoRepository votoRepo;

    public VotacaoSeguraController(
        VotacaoRepository votacaoRepo,
        OpcaoVotacaoRepository opcaoRepo,
        VotoRepository votoRepo
    ) {
        this.votacaoRepo = votacaoRepo;
        this.opcaoRepo = opcaoRepo;
        this.votoRepo = votoRepo;
    }

    @PostMapping("/votar")
    public ResponseEntity<?> votar(
        @AuthenticationPrincipal Usuario usuario,
        @RequestBody VotoAlunoLogadoRequestDTO request
    ) {
        if (usuario == null) {
            return ResponseEntity.status(401).body("Usuário não autenticado.");
        }

        if (usuario.getAluno() == null) {
            return ResponseEntity.status(403).body("Somente alunos podem votar.");
        }

        if (request.votacaoId() == null || request.opcaoId() == null) {
            return ResponseEntity.badRequest().body("Votação e opção são obrigatórias.");
        }

        Aluno aluno = usuario.getAluno();

        if (votoRepo.existsByVotacaoIdAndAlunoId(request.votacaoId(), aluno.getId())) {
            return ResponseEntity.badRequest().body("Você já votou nesta enquete.");
        }

        Votacao votacao = votacaoRepo.findById(request.votacaoId()).orElseThrow();
        OpcaoVotacao opcao = opcaoRepo.findById(request.opcaoId()).orElseThrow();

        if (votacao.getTurma() == null || aluno.getTurma() == null || !votacao.getTurma().getId().equals(aluno.getTurma().getId())) {
            return ResponseEntity.status(403).body("Voce nao pode votar em uma enquete de outra turma.");
        }

        if ("encerrada".equalsIgnoreCase(votacao.getStatus())
            || (votacao.getDataFim() != null && votacao.getDataFim().isBefore(LocalDate.now()))) {
            return ResponseEntity.badRequest().body("Esta votacao ja foi encerrada.");
        }

        if (opcao.getVotacao() == null || !opcao.getVotacao().getId().equals(votacao.getId())) {
            return ResponseEntity.badRequest().body("A opção não pertence à votação informada.");
        }

        Voto voto = new Voto();
        voto.setAluno(aluno);
        voto.setVotacao(votacao);
        voto.setOpcao(opcao);

        votoRepo.save(voto);

        return ResponseEntity.ok("Voto registrado com sucesso!");
    }
}
