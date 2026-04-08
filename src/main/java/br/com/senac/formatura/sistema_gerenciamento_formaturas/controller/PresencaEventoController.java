package br.com.senac.formatura.sistema_gerenciamento_formaturas.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.ConfirmacaoPresencaDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Aluno;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Evento;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.PresencaEvento;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Usuario;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.EventoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.PresencaEventoRepository;

@RestController
@RequestMapping("/api/eventos")
public class PresencaEventoController {

    private final EventoRepository eventoRepository;
    private final PresencaEventoRepository presencaRepository;

    public PresencaEventoController(
        EventoRepository eventoRepository,
        PresencaEventoRepository presencaRepository
    ) {
        this.eventoRepository = eventoRepository;
        this.presencaRepository = presencaRepository;
    }

    @PostMapping("/confirmar-presenca")
    public ResponseEntity<?> confirmarPresenca(
        @AuthenticationPrincipal Usuario usuario,
        @RequestBody ConfirmacaoPresencaDTO dto
    ) {
        if (usuario == null || usuario.getAluno() == null) {
            return ResponseEntity.status(403).body("Somente alunos podem confirmar presença.");
        }

        if (dto.eventoId() == null || dto.status() == null || dto.status().isBlank()) {
            return ResponseEntity.badRequest().body("Evento e status são obrigatórios.");
        }

        Aluno aluno = usuario.getAluno();
        Evento evento = eventoRepository.findById(dto.eventoId()).orElseThrow();

        if (evento.getTurma() == null || aluno.getTurma() == null || !evento.getTurma().getId().equals(aluno.getTurma().getId())) {
            return ResponseEntity.status(403).body("Voce nao pode confirmar presenca para um evento de outra turma.");
        }

        PresencaEvento presenca = presencaRepository
            .findByEventoIdAndAlunoId(evento.getId(), aluno.getId())
            .orElseGet(PresencaEvento::new);

        presenca.setEvento(evento);
        presenca.setAluno(aluno);
        presenca.setStatus(dto.status());

        presencaRepository.save(presenca);

        return ResponseEntity.ok("Presença atualizada com sucesso.");
    }
}
