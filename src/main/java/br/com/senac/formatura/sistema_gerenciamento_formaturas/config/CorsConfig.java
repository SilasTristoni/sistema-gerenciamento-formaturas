package br.com.senac.formatura.sistema_gerenciamento_formaturas.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // Libera tudo
                .allowedOrigins("*") // Permite qualquer site acessar (para desenvolvimento)
                .allowedMethods("GET", "POST", "PUT", "DELETE");
    }
}