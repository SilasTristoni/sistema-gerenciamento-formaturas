package br.com.senac.formatura.sistema_gerenciamento_formaturas.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Usuario;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.UsuarioRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.service.TokenService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired private AuthenticationManager manager;
    @Autowired private TokenService tokenService;
    @Autowired private UsuarioRepository usuarioRepository;

    @PostMapping("/login")
    public ResponseEntity<DadosTokenJWT> efetuLogin(@RequestBody DadosAutenticacao dados) {
        var authenticationToken = new UsernamePasswordAuthenticationToken(dados.login(), dados.senha());
        var authentication = manager.authenticate(authenticationToken);

        Usuario usuarioLogado = (Usuario) authentication.getPrincipal();
        String tokenJWT = tokenService.gerarToken(usuarioLogado);
        String nome = usuarioLogado.getAluno() != null ? usuarioLogado.getAluno().getNome() : "Admin";
        String login = usuarioLogado.getLogin() != null && !usuarioLogado.getLogin().isBlank() ? usuarioLogado.getLogin() : usuarioLogado.getEmail();

        return ResponseEntity.ok(new DadosTokenJWT(
            tokenJWT,
            usuarioLogado.getPerfil().name(),
            nome,
            login
        ));
    }

    @PostMapping("/demo/comissao")
    public ResponseEntity<DadosTokenJWT> loginDemoComissao() {
        return ResponseEntity.ok(emitirTokenDemo("demo.comissao"));
    }

    @PostMapping("/demo/aluno")
    public ResponseEntity<DadosTokenJWT> loginDemoAluno() {
        return ResponseEntity.ok(emitirTokenDemo("ana.souza"));
    }

    private DadosTokenJWT emitirTokenDemo(String login) {
        Usuario usuario = usuarioRepository.findUsuarioByLogin(login)
            .orElseThrow(() -> new IllegalStateException("Usuario demo nao encontrado. Reinicie a aplicacao para criar os seeds."));
        String tokenJWT = tokenService.gerarToken(usuario);
        String nome = usuario.getAluno() != null ? usuario.getAluno().getNome() : "Comissao Demo";
        String loginExibicao = usuario.getLogin() != null && !usuario.getLogin().isBlank() ? usuario.getLogin() : usuario.getEmail();
        return new DadosTokenJWT(tokenJWT, usuario.getPerfil().name(), nome, loginExibicao);
    }

    public record DadosAutenticacao(String login, String senha) {}
    public record DadosTokenJWT(String token, String perfil, String nome, String login) {}
}
