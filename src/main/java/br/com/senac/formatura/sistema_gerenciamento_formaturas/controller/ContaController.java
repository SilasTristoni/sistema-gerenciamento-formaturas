package br.com.senac.formatura.sistema_gerenciamento_formaturas.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.UsuarioLogadoResponseDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Usuario;

@RestController
@RequestMapping("/api/auth")
public class ContaController {

    @GetMapping("/me")
    public ResponseEntity<UsuarioLogadoResponseDTO> me(@AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            return ResponseEntity.status(401).build();
        }

        String nome = usuario.getAluno() != null ? usuario.getAluno().getNome() : "Comissão";
        Long alunoId = usuario.getAluno() != null ? usuario.getAluno().getId() : null;

        return ResponseEntity.ok(
            new UsuarioLogadoResponseDTO(
                usuario.getId(),
                nome,
                usuario.getEmail(),
                usuario.getLogin(),
                usuario.getPerfil().name(),
                alunoId
            )
        );
    }
}
