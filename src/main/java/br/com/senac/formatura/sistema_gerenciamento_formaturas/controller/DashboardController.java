package br.com.senac.formatura.sistema_gerenciamento_formaturas.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Evento;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.AlunoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.EventoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.LancamentoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.TurmaRepository;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired private LancamentoRepository lancamentoRepo;
    @Autowired private AlunoRepository alunoRepo;
    @Autowired private TurmaRepository turmaRepo;
    @Autowired private EventoRepository eventoRepo;

    @GetMapping("/resumo")
    public Map<String, Object> getResumo() {
        Map<String, Object> dados = new HashMap<>();
        
        // 1. Cálculos Financeiros
        Double receitas = lancamentoRepo.totalReceitas();
        Double despesas = lancamentoRepo.totalDespesas();
        Double saldo = receitas - despesas;

        dados.put("saldoTotal", saldo);
        dados.put("totalReceitas", receitas);
        dados.put("totalDespesas", despesas);

        // 2. Contagens
        dados.put("totalAlunos", alunoRepo.count());
        dados.put("totalTurmas", turmaRepo.count());
        
        // 3. Inadimplência (Lógica simples: alunos com status 'pendente' ou 'atrasado')
        long inadimplentes = alunoRepo.findAll().stream()
            .filter(a -> "atrasado".equalsIgnoreCase(a.getStatus()) || "pendente".equalsIgnoreCase(a.getStatus()))
            .count();
        dados.put("inadimplentes", inadimplentes);

        // 4. Próximo Evento (Pega o primeiro da lista como exemplo)
        List<Evento> eventos = eventoRepo.findAll();
        if(!eventos.isEmpty()) {
            // Idealmente você filtraria por data >= hoje no banco, mas para simplificar:
            Evento prox = eventos.get(0); 
            dados.put("proximoEventoNome", prox.getNome());
            dados.put("proximoEventoData", prox.getDataEvento());
        } else {
            dados.put("proximoEventoNome", "Nenhum agendado");
            dados.put("proximoEventoData", null);
        }
        
        dados.put("usuarioNome", "Administrador");
        
        return dados; 
    }
}