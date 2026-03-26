package br.com.senac.formatura.sistema_gerenciamento_formaturas.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Usuario;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.service.TokenService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired private AuthenticationManager manager;
    @Autowired private TokenService tokenService;

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

    public record DadosAutenticacao(String login, String senha) {}
    public record DadosTokenJWT(String token, String perfil, String nome, String login) {}
}