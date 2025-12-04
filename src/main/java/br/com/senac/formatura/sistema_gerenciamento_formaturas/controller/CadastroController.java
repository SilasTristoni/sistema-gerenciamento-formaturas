package br.com.senac.formatura.sistema_gerenciamento_formaturas.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.AlunoInputDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.EventoInputDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.LancamentoInputDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.VotacaoInputDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Aluno;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Evento;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.LancamentoFinanceiro;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.OpcaoVotacao;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Turma;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Votacao;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Voto;
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

    // --- MÉTODOS EXISTENTES (Turma, Aluno, Evento, Financeiro) ---
    // (Mantenha o código anterior destas partes aqui...)
    
    @PostMapping("/turma")
    public Turma criarTurma(@RequestBody Turma turma) { return turmaRepo.save(turma); }
    
    @GetMapping("/turmas")
    public List<Turma> listarTurmas() { return turmaRepo.findAll(); }

    @PostMapping("/aluno")
    public Aluno criarAluno(@RequestBody AlunoInputDTO dto) {
        Turma turma = turmaRepo.findById(dto.turmaId()).orElseThrow();
        Aluno aluno = new Aluno();
        aluno.setNome(dto.nome());
        aluno.setContato(dto.contato());
        aluno.setTurma(turma);
        return alunoRepo.save(aluno);
    }
    @GetMapping("/alunos")
    public List<Aluno> listarAlunos() { return alunoRepo.findAll(); }

    @PostMapping("/evento")
    public Evento criarEvento(@RequestBody EventoInputDTO dto) {
        Turma turma = turmaRepo.findById(dto.turmaId()).orElseThrow();
        Evento evento = new Evento();
        evento.setNome(dto.nome());
        evento.setDataEvento(dto.data());
        evento.setLocalEvento(dto.local());
        evento.setTurma(turma);
        return eventoRepo.save(evento);
    }
    @GetMapping("/eventos")
    public List<Evento> listarEventos() { return eventoRepo.findAll(); }

    @PostMapping("/lancamento")
    public LancamentoFinanceiro criarLancamento(@RequestBody LancamentoInputDTO dto) {
        Turma turma = turmaRepo.findById(dto.turmaId()).orElseThrow();
        LancamentoFinanceiro lanc = new LancamentoFinanceiro();
        lanc.setDescricao(dto.descricao());
        lanc.setValor(dto.valor());
        lanc.setTipo(dto.tipo());
        lanc.setDataLancamento(dto.data());
        lanc.setReferencia(dto.referencia());
        lanc.setTurma(turma);
        return lancamentoRepo.save(lanc);
    }
    @GetMapping("/financeiro")
    public List<LancamentoFinanceiro> listarFinanceiro() { return lancamentoRepo.findAll(); }


    // --- NOVO: MÓDULO DE VOTAÇÃO ---

    @GetMapping("/votacoes")
    public List<Votacao> listarVotacoes() {
        return votacaoRepo.findAll();
    }

    @PostMapping("/votacao")
    public Votacao criarVotacao(@RequestBody VotacaoInputDTO dto) {
        Turma turma = turmaRepo.findById(dto.turmaId()).orElseThrow();
        Votacao vot = new Votacao();
        vot.setTitulo(dto.titulo());
        vot.setDataFim(dto.dataFim());
        vot.setTurma(turma);
        return votacaoRepo.save(vot);
    }

    @PostMapping("/votacao/{id}/opcao")
    public OpcaoVotacao adicionarOpcao(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Votacao votacao = votacaoRepo.findById(id).orElseThrow();
        OpcaoVotacao opcao = new OpcaoVotacao();
        opcao.setNomeFornecedor(payload.get("nome")); // Reutilizando campo nomeFornecedor como "Nome da Opção"
        opcao.setVotacao(votacao);
        return opcaoRepo.save(opcao);
    }

    // Endpoint para Votar
    @PostMapping("/votar")
    public ResponseEntity<?> registrarVoto(@RequestBody VotoInputRequest request) {
        // 1. Verifica duplicidade
        if(votoRepo.existsByVotacaoIdAndAlunoId(request.votacaoId, request.alunoId)) {
            return ResponseEntity.badRequest().body("Erro: Este aluno já votou nesta enquete!");
        }

        // 2. Busca Entidades
        Votacao votacao = votacaoRepo.findById(request.votacaoId).orElseThrow();
        OpcaoVotacao opcao = opcaoRepo.findById(request.opcaoId).orElseThrow();
        Aluno aluno = alunoRepo.findById(request.alunoId).orElseThrow();

        // 3. Salva
        Voto voto = new Voto();
        voto.setVotacao(votacao);
        voto.setOpcao(opcao);
        voto.setAluno(aluno);
        votoRepo.save(voto);

        return ResponseEntity.ok("Voto registrado com sucesso!");
    }

    // DTO Interno simples para receber o JSON do voto
    public record VotoInputRequest(Long votacaoId, Long opcaoId, Long alunoId) {}
}