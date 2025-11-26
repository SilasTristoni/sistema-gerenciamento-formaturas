package br.com.senac.formatura.sistema_gerenciamento_formaturas.controller;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.*;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.*;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.AlunoInputDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cadastro")
// @CrossOrigin(origins = "*") // Descomente se tiver problemas de CORS localmente, ou use a classe de configuração global
public class CadastroController {

    @Autowired
    private TurmaRepository turmaRepository;

    @Autowired
    private AlunoRepository alunoRepository;

    @Autowired
    private EventoRepository eventoRepository;

    @Autowired
    private LancamentoRepository lancamentoRepository;

    // -----------------------------------------------------------
    // TURMAS
    // -----------------------------------------------------------
    @PostMapping("/turma")
    public Turma criarTurma(@RequestBody Turma turma) {
        return turmaRepository.save(turma);
    }

    @GetMapping("/turmas")
    public List<Turma> listarTurmas() {
        return turmaRepository.findAll();
    }

    // -----------------------------------------------------------
    // ALUNOS (Lógica com Relacionamento)
    // -----------------------------------------------------------
    @PostMapping("/aluno")
    public Aluno criarAluno(@RequestBody AlunoInputDTO dto) {
        // 1. Busca a turma no banco pelo ID recebido
        Turma turma = turmaRepository.findById(dto.turmaId())
                .orElseThrow(() -> new RuntimeException("Turma não encontrada com ID: " + dto.turmaId()));

        // 2. Cria o objeto Aluno e vincula a Turma
        Aluno aluno = new Aluno();
        aluno.setNome(dto.nome());
        aluno.setContato(dto.contato());
        aluno.setTurma(turma); // Vinculo importante!
        
        // 3. Salva
        return alunoRepository.save(aluno);
    }
    
    @GetMapping("/alunos")
    public List<Aluno> listarAlunos() {
        return alunoRepository.findAll();
    }

    // -----------------------------------------------------------
    // EVENTOS
    // -----------------------------------------------------------
    @PostMapping("/evento")
    public Evento criarEvento(@RequestBody Evento evento) {
        return eventoRepository.save(evento);
    }
    
    @GetMapping("/eventos")
    public List<Evento> listarEventos() {
        return eventoRepository.findAll();
    }

    // -----------------------------------------------------------
    // FINANCEIRO
    // -----------------------------------------------------------
    @PostMapping("/lancamento")
    public LancamentoFinanceiro criarLancamento(@RequestBody LancamentoFinanceiro lancamento) {
        return lancamentoRepository.save(lancamento);
    }
    
    @GetMapping("/financeiro")
    public List<LancamentoFinanceiro> listarFinanceiro() {
        return lancamentoRepository.findAll();
    }
}