package br.com.senac.formatura.sistema_gerenciamento_formaturas.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.AlunoInputDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.EventoInputDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.LancamentoInputDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.TarefaInputDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.VotacaoInputDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Aluno;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Evento;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.LancamentoFinanceiro;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.OpcaoVotacao;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Tarefa;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Turma;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Votacao;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.AlunoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.EventoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.LancamentoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.OpcaoVotacaoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.TarefaRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.TurmaRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.VotacaoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.VotoRepository;


@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/cadastro")
public class CadastroController {

    @Autowired private TurmaRepository turmaRepo;
    @Autowired private AlunoRepository alunoRepo;
    @Autowired private EventoRepository eventoRepo;
    @Autowired private LancamentoRepository lancamentoRepo;
    @Autowired private TarefaRepository tarefaRepo;
    @Autowired private VotacaoRepository votacaoRepo;
    @Autowired private OpcaoVotacaoRepository opcaoRepo;
    @Autowired private VotoRepository votoRepo;

    // --- TURMA ---
    @PostMapping("/turma")
    public Turma criarTurma(@RequestBody Turma turma) {
        return turmaRepo.save(turma);
    }
    
    @GetMapping("/turmas")
    public List<Turma> listarTurmas() { return turmaRepo.findAll(); }

    // --- ALUNO ---
    @PostMapping("/aluno")
    public Aluno criarAluno(@RequestBody AlunoInputDTO dto) {
        Turma turma = turmaRepo.findById(dto.turmaId())
                .orElseThrow(() -> new RuntimeException("Turma não encontrada"));
        
        Aluno aluno = new Aluno();
        aluno.setNome(dto.nome());
        aluno.setContato(dto.contato());
        aluno.setTurma(turma);
        return alunoRepo.save(aluno);
    }

    @GetMapping("/alunos")
    public List<Aluno> listarAlunos() { return alunoRepo.findAll(); }

    // --- EVENTO (ATUALIZADO) ---
    @PostMapping("/evento")
    public Evento criarEvento(@RequestBody EventoInputDTO dto) {
        Turma turma = turmaRepo.findById(dto.turmaId())
            .orElseThrow(() -> new RuntimeException("Turma não encontrada"));

        Evento evento = new Evento();
        evento.setNome(dto.nome());
        evento.setDataEvento(dto.data());
        evento.setLocalEvento(dto.local());
        evento.setTurma(turma); // Vínculo Obrigatório!
        
        return eventoRepo.save(evento);
    }
    
    @GetMapping("/eventos")
    public List<Evento> listarEventos() { return eventoRepo.findAll(); }

    // --- FINANCEIRO (ATUALIZADO) ---
    @PostMapping("/lancamento")
    public LancamentoFinanceiro criarLancamento(@RequestBody LancamentoInputDTO dto) {
        Turma turma = turmaRepo.findById(dto.turmaId())
            .orElseThrow(() -> new RuntimeException("Turma não encontrada"));

        LancamentoFinanceiro lanc = new LancamentoFinanceiro();
        lanc.setDescricao(dto.descricao());
        lanc.setValor(dto.valor());
        lanc.setTipo(dto.tipo());
        lanc.setDataLancamento(dto.data());
        lanc.setReferencia(dto.referencia());
        lanc.setTurma(turma);

        // Se veio ID de aluno, vincula ele também
        if(dto.alunoId() != null) {
            Aluno aluno = alunoRepo.findById(dto.alunoId()).orElse(null);
            lanc.setAluno(aluno);
        }

        return lancamentoRepo.save(lanc);
    }
    
    @GetMapping("/financeiro")
    public List<LancamentoFinanceiro> listarFinanceiro() { return lancamentoRepo.findAll(); }

    // --- TAREFAS (NOVO) ---
    @PostMapping("/tarefa")
    public Tarefa criarTarefa(@RequestBody TarefaInputDTO dto) {
        Turma turma = turmaRepo.findById(dto.turmaId())
            .orElseThrow(() -> new RuntimeException("Turma não encontrada"));
            
        Tarefa tarefa = new Tarefa();
        tarefa.setTitulo(dto.titulo());
        tarefa.setDescricao(dto.descricao());
        tarefa.setDataLimite(dto.dataLimite());
        tarefa.setTurma(turma);
        
        if(dto.responsavelId() != null) {
            Aluno resp = alunoRepo.findById(dto.responsavelId()).orElse(null);
            tarefa.setResponsavel(resp);
        }
        
        return tarefaRepo.save(tarefa);
    }

    @GetMapping("/tarefas")
    public List<Tarefa> listarTarefas() { return tarefaRepo.findAll(); }

    // --- VOTAÇÃO (NOVO) ---
    @PostMapping("/votacao")
    public Votacao criarVotacao(@RequestBody VotacaoInputDTO dto) {
        Turma turma = turmaRepo.findById(dto.turmaId())
            .orElseThrow(() -> new RuntimeException("Turma não encontrada"));
            
        Votacao vot = new Votacao();
        vot.setTitulo(dto.titulo());
        vot.setDataFim(dto.dataFim());
        vot.setTurma(turma);
        
        return votacaoRepo.save(vot);
    }
    
    // Endpoint auxiliar para adicionar opções na votação
    @PostMapping("/votacao/opcao")
    public OpcaoVotacao adicionarOpcao(@RequestBody OpcaoVotacao opcao) {
        // Assume-se que o objeto opcao já venha com o votacao_id correto no JSON se o frontend montar certo,
        // ou você pode criar um DTO específico para isso também se preferir.
        // Por simplificação, vamos salvar direto se o JSON estiver estruturado.
        return opcaoRepo.save(opcao);
    }
}