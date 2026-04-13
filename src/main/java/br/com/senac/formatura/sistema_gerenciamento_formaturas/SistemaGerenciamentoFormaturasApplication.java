package br.com.senac.formatura.sistema_gerenciamento_formaturas;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class SistemaGerenciamentoFormaturasApplication {

	private final Environment environment;

	public SistemaGerenciamentoFormaturasApplication(Environment environment) {
		this.environment = environment;
	}

	public static void main(String[] args) {
		SpringApplication.run(SistemaGerenciamentoFormaturasApplication.class, args);
	}

	@EventListener(ApplicationReadyEvent.class)
	public void logApplicationUrl() {
		String port = environment.getProperty("local.server.port", environment.getProperty("server.port", "8080"));
		String contextPath = environment.getProperty("server.servlet.context-path", "");
		if (contextPath == null || contextPath.isBlank()) {
			contextPath = "";
		}

		System.out.println();
		System.out.println("Aplicacao iniciada em: http://localhost:" + port + contextPath + "/");
		System.out.println("Login: http://localhost:" + port + contextPath + "/login.html");
		System.out.println();
	}

}
