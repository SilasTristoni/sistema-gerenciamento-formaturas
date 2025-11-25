package br.com.senac.formatura.sistema_gerenciamento_formaturas.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    // Simula os dados que viriam do Banco de Dados
    @GetMapping("/resumo")
    public Map<String, Object> getResumo() {
        Map<String, Object> dados = new HashMap<>();
        
        // Dados Financeiros (RF01)
        dados.put("saldoTotal", 45200.00);
        dados.put("receitaMes", 1200.00);
        dados.put("inadimplentes", 3);
        
        // Dados do Usuário Logado (Simulado)
        dados.put("usuarioNome", "Arthur Vieira");
        dados.put("usuarioPerfil", "ADMIN"); // ou "STUDENT"
        
        return dados; // O Spring transforma isso automaticamente em JSON
    }
}