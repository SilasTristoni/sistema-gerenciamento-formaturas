package br.com.senac.formatura.sistema_gerenciamento_formaturas.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.core.userdetails.UserDetails;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    UserDetails findByEmail(String email);
    UserDetails findByLogin(String login);
    Optional<Usuario> findUsuarioByLogin(String login);
    Optional<Usuario> findUsuarioByEmail(String email);
    Optional<Usuario> findByAlunoId(Long alunoId);
}
