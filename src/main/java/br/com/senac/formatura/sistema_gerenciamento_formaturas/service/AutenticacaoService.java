package br.com.senac.formatura.sistema_gerenciamento_formaturas.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Aluno;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Perfil;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Usuario;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.AlunoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.UsuarioRepository;

@Service
public class AutenticacaoService implements UserDetailsService {

    @Autowired
    private UsuarioRepository repository;

    @Autowired
    private AlunoRepository alunoRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserDetails usuario = repository.findByLogin(username);

        if (usuario == null) {
            usuario = repository.findByEmail(username);
        }

        if (usuario == null) {
            throw new UsernameNotFoundException("Usuario nao encontrado: " + username);
        }

        if (usuario instanceof Usuario usuarioEntidade
            && usuarioEntidade.getPerfil() == Perfil.ROLE_ALUNO
            && usuarioEntidade.getAluno() == null) {
            Aluno aluno = alunoRepository.findByIdentificador(usuarioEntidade.getLogin());
            if (aluno != null) {
                usuarioEntidade.setAluno(aluno);
                repository.save(usuarioEntidade);
            }
        }

        return usuario;
    }
}
