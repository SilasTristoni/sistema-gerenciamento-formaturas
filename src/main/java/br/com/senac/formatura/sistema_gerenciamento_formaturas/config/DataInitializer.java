package br.com.senac.formatura.sistema_gerenciamento_formaturas.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Perfil;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Usuario;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.UsuarioRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Verifica se o banco está vazio de usuários
        if (usuarioRepository.count() == 0) {
            Usuario admin = new Usuario();
            admin.setEmail("admin@gestaoform.com"); // Login padrão
            admin.setSenha(passwordEncoder.encode("admin123")); // Senha padrão criptografada
            admin.setPerfil(Perfil.ROLE_COMISSAO); // Nível de acesso máximo
            
            usuarioRepository.save(admin);
            
            System.out.println("==================================================");
            System.out.println("🚀 USUÁRIO PADRÃO CRIADO COM SUCESSO!");
            System.out.println("📧 Login: admin@gestaoform.com");
            System.out.println("🔑 Senha: admin123");
            System.out.println("==================================================");
        }
    }
}