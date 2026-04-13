package br.com.senac.formatura.sistema_gerenciamento_formaturas.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class FrontendRedirectController {

    @GetMapping("/")
    public String redirectToLogin() {
        return "redirect:/login.html";
    }
}
