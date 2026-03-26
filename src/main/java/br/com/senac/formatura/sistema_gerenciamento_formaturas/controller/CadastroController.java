package br.com.senac.formatura.sistema_gerenciamento_formaturas.controller;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.AlunoInputDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.EventoInputDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.LancamentoInputDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.VotacaoInputDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Aluno;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Evento;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.LancamentoFinanceiro;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.OpcaoVotacao;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Perfil;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Turma;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Usuario;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Votacao;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Voto;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.AlunoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.EventoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.LancamentoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.OpcaoVotacaoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.TarefaRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.TurmaRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.UsuarioRepository;
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
    @Autowired private UsuarioRepository usuarioRepo;
    @Autowired private PasswordEncoder passwordEncoder;

    @GetMapping("/turmas")
    public List<Turma> listarTurmas() { return turmaRepo.findAll(); }

    @PostMapping("/turma")
    public Turma criarTurma(@RequestBody Turma turma) { return turmaRepo.save(turma); }

    @PutMapping("/turma/{id}")
    public Turma atualizarTurma(@PathVariable Long id, @RequestBody Turma dto) {
        Turma turma = turmaRepo.findById(id).orElseThrow();
        turma.setNome(dto.getNome());
        turma.setCurso(dto.getCurso());
        return turmaRepo.save(turma);
    }

    @DeleteMapping("/turma/{id}")
    public ResponseEntity<?> deletarTurma(@PathVariable Long id) {
        if(!turmaRepo.existsById(id)) return ResponseEntity.notFound().build();
        turmaRepo.deleteById(id);
        return ResponseEntity.ok("Excluído com sucesso");
    }

    @GetMapping("/alunos")
    public List<Aluno> listarAlunos() { return alunoRepo.findAll(); }

    @PostMapping("/aluno")
    public Aluno criarAluno(@RequestBody AlunoInputDTO dto) {
        Turma turma = turmaRepo.findById(dto.turmaId()).orElseThrow();
        String identificador = gerarIdentificadorUnico(dto.identificador(), dto.nome());

        Aluno aluno = new Aluno();
        aluno.setNome(dto.nome());
        aluno.setIdentificador(identificador);
        aluno.setContato(dto.contato());
        aluno.setTurma(turma);
        Aluno alunoSalvo = alunoRepo.save(aluno);

        Usuario usuario = new Usuario();
        usuario.setLogin(identificador);
        usuario.setEmail(dto.contato());
        usuario.setSenha(passwordEncoder.encode("mudar123"));
        usuario.setPerfil("COMISSAO".equalsIgnoreCase(dto.perfil()) ? Perfil.ROLE_COMISSAO : Perfil.ROLE_ALUNO);
        usuario.setAluno(alunoSalvo);
        usuarioRepo.save(usuario);

        return alunoSalvo;
    }

    @PutMapping("/aluno/{id}")
    public Aluno atualizarAluno(@PathVariable Long id, @RequestBody AlunoInputDTO dto) {
        Aluno aluno = alunoRepo.findById(id).orElseThrow();
        Turma turma = turmaRepo.findById(dto.turmaId()).orElseThrow();
        String identificador = gerarIdentificadorUnico(dto.identificador(), dto.nome(), aluno.getId());

        aluno.setNome(dto.nome());
        aluno.setIdentificador(identificador);
        aluno.setContato(dto.contato());
        aluno.setTurma(turma);
        Aluno alunoAtualizado = alunoRepo.save(aluno);

        usuarioRepo.findByAlunoId(aluno.getId()).ifPresent(usuario -> {
            usuario.setLogin(identificador);
            usuario.setEmail(dto.contato());
            usuario.setPerfil("COMISSAO".equalsIgnoreCase(dto.perfil()) ? Perfil.ROLE_COMISSAO : Perfil.ROLE_ALUNO);
            usuarioRepo.save(usuario);
        });

        return alunoAtualizado;
    }

    @DeleteMapping("/aluno/{id}")
    public ResponseEntity<?> deletarAluno(@PathVariable Long id) {
        if(!alunoRepo.existsById(id)) return ResponseEntity.notFound().build();
        usuarioRepo.findByAlunoId(id).ifPresent(usuarioRepo::delete);
        alunoRepo.deleteById(id);
        return ResponseEntity.ok("Excluído com sucesso");
    }

    @PostMapping("/alunos/importar")
    public ResponseEntity<String> importarAlunosCSV(@RequestParam("arquivo") MultipartFile arquivo, @RequestParam("turmaId") Long turmaId) {
        Turma turma = turmaRepo.findById(turmaId).orElseThrow(() -> new RuntimeException("Turma não encontrada"));
        int cadastrados = 0;

        try (BufferedReader br = new BufferedReader(new InputStreamReader(arquivo.getInputStream(), StandardCharsets.UTF_8))) {
            String linha;
            boolean primeiraLinha = true;
            while ((linha = br.readLine()) != null) {
                if (primeiraLinha) { primeiraLinha = false; continue; }
                String[] dados = linha.split(";");
                if (dados.length >= 1) {
                    String nome = dados[0].trim();
                    String emailContato = dados.length > 1 ? dados[1].trim() : "";
                    String identificador = gerarIdentificadorUnico(null, nome);

                    Aluno aluno = new Aluno();
                    aluno.setNome(nome);
                    aluno.setIdentificador(identificador);
                    aluno.setContato(emailContato);
                    aluno.setTurma(turma);
                    Aluno alunoSalvo = alunoRepo.save(aluno);

                    Usuario usuario = new Usuario();
                    usuario.setLogin(identificador);
                    usuario.setEmail(emailContato.isBlank() ? identificador + "@gestaoform.local" : emailContato);
                    usuario.setSenha(passwordEncoder.encode("mudar123"));
                    usuario.setPerfil(Perfil.ROLE_ALUNO);
                    usuario.setAluno(alunoSalvo);
                    usuarioRepo.save(usuario);
                    cadastrados++;
                }
            }
            return ResponseEntity.ok(cadastrados + " alunos foram importados com sucesso.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao processar o arquivo: " + e.getMessage());
        }
    }

    @GetMapping("/eventos")
    public List<Evento> listarEventos() { return eventoRepo.findAll(); }

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

    @PutMapping("/evento/{id}")
    public Evento atualizarEvento(@PathVariable Long id, @RequestBody EventoInputDTO dto) {
        Evento evento = eventoRepo.findById(id).orElseThrow();
        Turma turma = turmaRepo.findById(dto.turmaId()).orElseThrow();
        evento.setNome(dto.nome());
        evento.setDataEvento(dto.data());
        evento.setLocalEvento(dto.local());
        evento.setTurma(turma);
        return eventoRepo.save(evento);
    }

    @DeleteMapping("/evento/{id}")
    public ResponseEntity<?> deletarEvento(@PathVariable Long id) {
        if(!eventoRepo.existsById(id)) return ResponseEntity.notFound().build();
        eventoRepo.deleteById(id);
        return ResponseEntity.ok("Excluído com sucesso");
    }

    @GetMapping("/financeiro")
    public List<LancamentoFinanceiro> listarFinanceiro() { return lancamentoRepo.findAll(); }

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

    @PutMapping("/lancamento/{id}")
    public LancamentoFinanceiro atualizarLancamento(@PathVariable Long id, @RequestBody LancamentoInputDTO dto) {
        LancamentoFinanceiro lanc = lancamentoRepo.findById(id).orElseThrow();
        Turma turma = turmaRepo.findById(dto.turmaId()).orElseThrow();
        lanc.setDescricao(dto.descricao());
        lanc.setValor(dto.valor());
        lanc.setTipo(dto.tipo());
        lanc.setDataLancamento(dto.data());
        lanc.setReferencia(dto.referencia());
        lanc.setTurma(turma);
        return lancamentoRepo.save(lanc);
    }

    @DeleteMapping("/lancamento/{id}")
    public ResponseEntity<?> deletarLancamento(@PathVariable Long id) {
        if(!lancamentoRepo.existsById(id)) return ResponseEntity.notFound().build();
        lancamentoRepo.deleteById(id);
        return ResponseEntity.ok("Excluído com sucesso");
    }

    @GetMapping("/votacoes")
    public List<Votacao> listarVotacoes() { return votacaoRepo.findAll(); }

    @PostMapping("/votacao")
    public Votacao criarVotacao(@RequestBody VotacaoInputDTO dto) {
        Turma turma = turmaRepo.findById(dto.turmaId()).orElseThrow();
        Votacao vot = new Votacao();
        vot.setTitulo(dto.titulo());
        vot.setDataFim(dto.dataFim());
        vot.setTurma(turma);
        return votacaoRepo.save(vot);
    }

    @PutMapping("/votacao/{id}")
    public Votacao atualizarVotacao(@PathVariable Long id, @RequestBody VotacaoInputDTO dto) {
        Votacao vot = votacaoRepo.findById(id).orElseThrow();
        Turma turma = turmaRepo.findById(dto.turmaId()).orElseThrow();
        vot.setTitulo(dto.titulo());
        vot.setDataFim(dto.dataFim());
        vot.setTurma(turma);
        return votacaoRepo.save(vot);
    }

    @DeleteMapping("/votacao/{id}")
    public ResponseEntity<?> deletarVotacao(@PathVariable Long id) {
        if(!votacaoRepo.existsById(id)) return ResponseEntity.notFound().build();
        votacaoRepo.deleteById(id);
        return ResponseEntity.ok("Excluído com sucesso");
    }

    @PostMapping("/votacao/{id}/opcao")
    public OpcaoVotacao adicionarOpcao(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Votacao votacao = votacaoRepo.findById(id).orElseThrow();
        OpcaoVotacao opcao = new OpcaoVotacao();
        opcao.setNomeFornecedor(payload.get("nome"));
        opcao.setVotacao(votacao);
        return opcaoRepo.save(opcao);
    }

    @PostMapping("/votar")
    public ResponseEntity<?> registrarVoto(@RequestBody VotoInputRequest request) {
        if(votoRepo.existsByVotacaoIdAndAlunoId(request.votacaoId(), request.alunoId())) {
            return ResponseEntity.badRequest().body("Erro: Este aluno já votou nesta enquete!");
        }
        Votacao votacao = votacaoRepo.findById(request.votacaoId()).orElseThrow();
        OpcaoVotacao opcao = opcaoRepo.findById(request.opcaoId()).orElseThrow();
        Aluno aluno = alunoRepo.findById(request.alunoId()).orElseThrow();

        Voto voto = new Voto();
        voto.setVotacao(votacao);
        voto.setOpcao(opcao);
        voto.setAluno(aluno);
        votoRepo.save(voto);

        return ResponseEntity.ok("Voto registado com sucesso!");
    }

    private String gerarIdentificadorUnico(String identificadorInformado, String nome) {
        return gerarIdentificadorUnico(identificadorInformado, nome, null);
    }

    private String gerarIdentificadorUnico(String identificadorInformado, String nome, Long alunoIdAtual) {
        String base = (identificadorInformado != null && !identificadorInformado.isBlank())
            ? normalizarIdentificador(identificadorInformado)
            : gerarIdentificadorBase(nome);

        if (base.isBlank()) base = "aluno";

        String candidato = base;
        int contador = 2;

        while (true) {
            var existente = usuarioRepo.findUsuarioByLogin(candidato);
            if (existente.isEmpty()) return candidato;
            if (alunoIdAtual != null && existente.get().getAluno() != null && alunoIdAtual.equals(existente.get().getAluno().getId())) {
                return candidato;
            }
            candidato = base + "." + contador++;
        }
    }

    private String gerarIdentificadorBase(String nome) {
        if (nome == null || nome.isBlank()) return "aluno";
        String limpo = Normalizer.normalize(nome, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        String[] partes = limpo.trim().toLowerCase().split("\\s+");
        if (partes.length == 1) return normalizarIdentificador(partes[0]);
        return normalizarIdentificador(partes[0] + "." + partes[partes.length - 1]);
    }

    private String normalizarIdentificador(String valor) {
        return Normalizer.normalize(valor == null ? "" : valor, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .toLowerCase()
            .replaceAll("[^a-z0-9._-]", ".")
            .replaceAll("\\.{2,}", ".")
            .replaceAll("^[._-]+|[._-]+$", "");
    }

    public record VotoInputRequest(Long votacaoId, Long opcaoId, Long alunoId) {}
}