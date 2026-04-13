package br.com.senac.formatura.sistema_gerenciamento_formaturas.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Perfil;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Usuario;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.UsuarioRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.create-default-admin:true}")
    private boolean createDefaultAdmin;

    @Value("${app.bootstrap.default-admin-email:admin@gestaoform.com}")
    private String defaultAdminEmail;

    @Value("${app.bootstrap.default-admin-password:admin123}")
    private String defaultAdminPassword;

    @Override
    public void run(String... args) {
        if (!createDefaultAdmin || usuarioRepository.count() > 0) {
            return;
        }

        Usuario admin = new Usuario();
        admin.setEmail(defaultAdminEmail);
        admin.setSenha(passwordEncoder.encode(defaultAdminPassword));
        admin.setPerfil(Perfil.ROLE_COMISSAO);

        usuarioRepository.save(admin);
        LOGGER.info("Usuario administrador inicial criado para {}", defaultAdminEmail);
    }
}
