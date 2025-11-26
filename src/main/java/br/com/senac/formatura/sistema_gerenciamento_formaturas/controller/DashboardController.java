package br.com.senac.formatura.sistema_gerenciamento_formaturas.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    // Simula os dados de resumo (futuramente você pode injetar os Repositories aqui para calcular reais)
    @GetMapping("/resumo")
    public Map<String, Object> getResumo() {
        Map<String, Object> dados = new HashMap<>();
        
        dados.put("saldoTotal", 45200.00); // Exemplo estático
        dados.put("receitaMes", 1200.00);
        dados.put("inadimplentes", 3);
        
        dados.put("usuarioNome", "Arthur Vieira");
        dados.put("usuarioPerfil", "ADMIN"); 
        
        return dados; 
    }
}