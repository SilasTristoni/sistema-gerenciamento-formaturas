package br.com.senac.formatura.sistema_gerenciamento_formaturas.config;

import java.util.Arrays;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private SecurityFilter securityFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .cors(cors -> cors.configurationSource(request -> {
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowedOrigins(Arrays.asList("*")); 
                configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                configuration.setAllowedHeaders(Arrays.asList("*"));
                return configuration;
            }))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(req -> {
                // Rotas públicas (Login)
                req.requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll();
                
                // Rotas de leitura (Dashboard, Eventos, etc) - Ambos podem acessar
                req.requestMatchers(HttpMethod.GET, "/api/dashboard/**").hasAnyRole("ALUNO", "COMISSAO");
                req.requestMatchers(HttpMethod.GET, "/api/cadastro/**").hasAnyRole("ALUNO", "COMISSAO");
                
                // Rotas de Votação - Ambos podem votar
                req.requestMatchers(HttpMethod.POST, "/api/cadastro/votar").hasAnyRole("ALUNO", "COMISSAO");

                // Restante dos POSTs (Criar turmas, eventos, alunos, finanças) - SÓ COMISSÃO
                req.requestMatchers(HttpMethod.POST, "/api/cadastro/**").hasRole("COMISSAO");
                req.requestMatchers(HttpMethod.PUT, "/api/cadastro/**").hasRole("COMISSAO");
                req.requestMatchers(HttpMethod.DELETE, "/api/cadastro/**").hasRole("COMISSAO");

                req.anyRequest().authenticated();
            })
            .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}