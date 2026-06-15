package br.com.senac.formatura.sistema_gerenciamento_formaturas.controller;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
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
import org.springframework.web.server.ResponseStatusException;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.AlunoInputDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.EventoInputDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.EventoResumoDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.LancamentoInputDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.VotacaoInputDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.VotacaoResultadoDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Aluno;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Evento;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.LancamentoFinanceiro;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.OpcaoVotacao;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Perfil;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.PresencaEvento;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Turma;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Usuario;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Votacao;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Voto;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.AlunoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.EventoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.LancamentoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.OpcaoVotacaoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.PresencaEventoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.TarefaRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.TurmaRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.UsuarioRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.VotacaoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.VotoRepository;
import jakarta.transaction.Transactional;

@RestController
@RequestMapping("/api/cadastro")
public class CadastroController {
    private static final String SENHA_PADRAO_ALUNO = "mudar123";

    @Autowired private TurmaRepository turmaRepo;
    @Autowired private AlunoRepository alunoRepo;
    @Autowired private EventoRepository eventoRepo;
    @Autowired private LancamentoRepository lancamentoRepo;
    @Autowired private TarefaRepository tarefaRepo;
    @Autowired private PresencaEventoRepository presencaEventoRepo;
    @Autowired private VotacaoRepository votacaoRepo;
    @Autowired private OpcaoVotacaoRepository opcaoRepo;
    @Autowired private VotoRepository votoRepo;
    @Autowired private UsuarioRepository usuarioRepo;
    @Autowired private PasswordEncoder passwordEncoder;

    @GetMapping("/turmas")
    public List<Turma> listarTurmas() {
        List<Turma> turmas = turmaRepo.findAll(Sort.by(Sort.Order.asc("nome")));
        turmas.forEach(this::syncTurmaTotalArrecadado);
        return turmas;
    }

    @PostMapping("/turma")
    public Turma criarTurma(@RequestBody Turma turma) {
        turma.setNome(requireText(turma.getNome(), "Nome da turma e obrigatorio."));
        turma.setCurso(requireText(firstNonBlank(turma.getCurso(), turma.getNome()), "Curso e obrigatorio."));
        turma.setInstituicao(firstNonBlank(turma.getInstituicao(), "Instituicao nao informada"));
        turma.setAnoSemestre(firstNonBlank(turma.getAnoSemestre(), "Nao informado"));
        turma.setRepresentante(normalizeText(turma.getRepresentante()));
        turma.setStatus(resolveOption(turma.getStatus(), "ATIVA", List.of("ATIVA", "CONCLUIDA", "PAUSADA")));
        turma.setMetaArrecadacao(normalizeMoney(turma.getMetaArrecadacao()));
        turma.setTotalArrecadado(normalizeMoney(turma.getTotalArrecadado()));
        return turmaRepo.save(turma);
    }

    @PutMapping("/turma/{id}")
    public Turma atualizarTurma(@PathVariable Long id, @RequestBody Turma dto) {
        Turma turma = turmaRepo.findById(id).orElseThrow();
        turma.setNome(requireText(dto.getNome(), "Nome da turma e obrigatorio."));
        turma.setCurso(requireText(firstNonBlank(dto.getCurso(), dto.getNome()), "Curso e obrigatorio."));
        turma.setInstituicao(firstNonBlank(dto.getInstituicao(), turma.getInstituicao(), "Instituicao nao informada"));
        turma.setAnoSemestre(firstNonBlank(dto.getAnoSemestre(), turma.getAnoSemestre(), "Nao informado"));
        turma.setRepresentante(normalizeText(dto.getRepresentante()));
        turma.setStatus(resolveOption(dto.getStatus(), "ATIVA", List.of("ATIVA", "CONCLUIDA", "PAUSADA")));
        turma.setMetaArrecadacao(normalizeMoney(dto.getMetaArrecadacao()));
        return turmaRepo.save(turma);
    }

    @DeleteMapping("/turma/{id}")
    public ResponseEntity<?> deletarTurma(@PathVariable Long id) {
        if(!turmaRepo.existsById(id)) return ResponseEntity.notFound().build();
        turmaRepo.deleteById(id);
        return ResponseEntity.ok("Excluído com sucesso");
    }

    @GetMapping("/alunos")
    public List<Aluno> listarAlunos() { return alunoRepo.findAll(Sort.by(Sort.Order.asc("nome"))); }

    @PostMapping("/aluno")
    public Aluno criarAluno(@RequestBody AlunoInputDTO dto) {
        Turma turma = turmaRepo.findById(dto.turmaId()).orElseThrow();
        String nome = requireText(dto.nome(), "Nome do aluno e obrigatorio.");
        String email = normalizeText(firstNonBlank(dto.email(), dto.contato()));
        String whatsapp = normalizeText(dto.whatsapp());
        String contato = firstNonBlank(email, whatsapp, normalizeText(dto.contato()));
        String identificador = gerarIdentificadorUnico(dto.identificador(), nome);
        String emailContato = resolveEmailContato(email, identificador);
        boolean senhaTemporaria = dto.senha() == null || dto.senha().isBlank();

        Aluno aluno = new Aluno();
        aluno.setNome(nome);
        aluno.setIdentificador(identificador);
        aluno.setEmail(email);
        aluno.setWhatsapp(whatsapp);
        aluno.setContato(contato);
        aluno.setTurma(turma);
        aluno.setStatus(resolveOption(dto.status(), "ATIVO", List.of("ATIVO", "PENDENTE", "DESISTENTE")));
        aluno.setObservacaoInterna(normalizeText(dto.observacaoInterna()));
        aluno.setPrecisaTrocarSenha(senhaTemporaria);
        Aluno alunoSalvo = alunoRepo.save(aluno);

        Usuario usuario = new Usuario();
        usuario.setLogin(identificador);
        usuario.setEmail(emailContato);
        usuario.setSenha(passwordEncoder.encode(resolveSenhaCadastro(dto.senha())));
        usuario.setPerfil("COMISSAO".equalsIgnoreCase(dto.perfil()) ? Perfil.ROLE_COMISSAO : Perfil.ROLE_ALUNO);
        usuario.setAluno(alunoSalvo);
        usuarioRepo.save(usuario);

        return alunoSalvo;
    }

    @PutMapping("/aluno/{id}")
    public Aluno atualizarAluno(@PathVariable Long id, @RequestBody AlunoInputDTO dto) {
        Aluno aluno = alunoRepo.findById(id).orElseThrow();
        Turma turma = turmaRepo.findById(dto.turmaId()).orElseThrow();
        String nome = requireText(dto.nome(), "Nome do aluno e obrigatorio.");
        String email = normalizeText(firstNonBlank(dto.email(), dto.contato()));
        String whatsapp = normalizeText(dto.whatsapp());
        String contato = firstNonBlank(email, whatsapp, normalizeText(dto.contato()));
        String identificador = gerarIdentificadorUnico(dto.identificador(), nome, aluno.getId());
        String emailContato = resolveEmailContato(email, identificador);

        aluno.setNome(nome);
        aluno.setIdentificador(identificador);
        aluno.setEmail(email);
        aluno.setWhatsapp(whatsapp);
        aluno.setContato(contato);
        aluno.setTurma(turma);
        aluno.setStatus(resolveOption(dto.status(), firstNonBlank(aluno.getStatus(), "ATIVO"), List.of("ATIVO", "PENDENTE", "DESISTENTE")));
        aluno.setObservacaoInterna(normalizeText(dto.observacaoInterna()));
        Aluno alunoAtualizado = alunoRepo.save(aluno);

        usuarioRepo.findByAlunoId(aluno.getId()).ifPresent(usuario -> {
            usuario.setLogin(identificador);
            usuario.setEmail(emailContato);
            usuario.setPerfil("COMISSAO".equalsIgnoreCase(dto.perfil()) ? Perfil.ROLE_COMISSAO : Perfil.ROLE_ALUNO);
            if (dto.senha() != null && !dto.senha().isBlank()) {
                usuario.setSenha(passwordEncoder.encode(validateProvidedPassword(dto.senha())));
                aluno.setPrecisaTrocarSenha(false);
                alunoRepo.save(aluno);
            }
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
                    String nome = requireText(dados[0], "Nome do aluno e obrigatorio no CSV.");
                    String identificador = gerarIdentificadorUnico(dados.length > 1 ? dados[1] : null, nome);
                    String emailContato = dados.length > 2 ? normalizeText(dados[2]) : "";
                    String whatsapp = dados.length > 3 ? normalizeText(dados[3]) : "";
                    String status = dados.length > 4 ? dados[4] : "ATIVO";
                    String observacao = dados.length > 5 ? dados[5] : "";

                    Aluno aluno = new Aluno();
                    aluno.setNome(nome);
                    aluno.setIdentificador(identificador);
                    aluno.setEmail(emailContato);
                    aluno.setWhatsapp(whatsapp);
                    aluno.setContato(firstNonBlank(emailContato, whatsapp));
                    aluno.setStatus(resolveOption(status, "ATIVO", List.of("ATIVO", "PENDENTE", "DESISTENTE")));
                    aluno.setObservacaoInterna(normalizeText(observacao));
                    aluno.setPrecisaTrocarSenha(true);
                    aluno.setTurma(turma);
                    Aluno alunoSalvo = alunoRepo.save(aluno);

                    Usuario usuario = new Usuario();
                    usuario.setLogin(identificador);
                    usuario.setEmail(resolveEmailContato(emailContato, identificador));
                    usuario.setSenha(passwordEncoder.encode(SENHA_PADRAO_ALUNO));
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
    public List<EventoResumoDTO> listarEventos() {
        return eventoRepo.findAll(Sort.by(
            Sort.Order.asc("dataEvento"),
            Sort.Order.asc("nome")
        )).stream()
            .map(this::toEventoResumo)
            .toList();
    }

    @PostMapping("/evento")
    public Evento criarEvento(@RequestBody EventoInputDTO dto) {
        Turma turma = turmaRepo.findById(dto.turmaId()).orElseThrow();
        Evento evento = new Evento();
        evento.setNome(requireText(dto.nome(), "Titulo do evento e obrigatorio."));
        evento.setDescricao(normalizeText(dto.descricao()));
        evento.setDataEvento(dto.data());
        evento.setHorario(dto.horario());
        evento.setLocalEvento(normalizeText(dto.local()));
        evento.setTipo(resolveOption(dto.tipo(), "REUNIAO_GERAL", List.of("REUNIAO_COMISSAO", "REUNIAO_GERAL", "ENSAIO", "PAGAMENTO", "VOTACAO", "EVENTO_OFICIAL", "PRAZO_IMPORTANTE")));
        evento.setResponsavel(normalizeText(dto.responsavel()));
        evento.setStatus(resolveOption(dto.status(), "AGENDADO", List.of("AGENDADO", "CONCLUIDO", "CANCELADO")));
        evento.setTurma(turma);
        return eventoRepo.save(evento);
    }

    @PutMapping("/evento/{id}")
    public Evento atualizarEvento(@PathVariable Long id, @RequestBody EventoInputDTO dto) {
        Evento evento = eventoRepo.findById(id).orElseThrow();
        Turma turma = turmaRepo.findById(dto.turmaId()).orElseThrow();
        evento.setNome(requireText(dto.nome(), "Titulo do evento e obrigatorio."));
        evento.setDescricao(normalizeText(dto.descricao()));
        evento.setDataEvento(dto.data());
        evento.setHorario(dto.horario());
        evento.setLocalEvento(normalizeText(dto.local()));
        evento.setTipo(resolveOption(dto.tipo(), firstNonBlank(evento.getTipo(), "REUNIAO_GERAL"), List.of("REUNIAO_COMISSAO", "REUNIAO_GERAL", "ENSAIO", "PAGAMENTO", "VOTACAO", "EVENTO_OFICIAL", "PRAZO_IMPORTANTE")));
        evento.setResponsavel(normalizeText(dto.responsavel()));
        evento.setStatus(resolveOption(dto.status(), firstNonBlank(evento.getStatus(), "AGENDADO"), List.of("AGENDADO", "CONCLUIDO", "CANCELADO")));
        evento.setTurma(turma);
        return eventoRepo.save(evento);
    }

    @DeleteMapping("/evento/{id}")
    @Transactional
    public ResponseEntity<?> deletarEvento(@PathVariable Long id) {
        if(!eventoRepo.existsById(id)) return ResponseEntity.notFound().build();
        presencaEventoRepo.deleteByEventoId(id);
        eventoRepo.deleteById(id);
        return ResponseEntity.ok("Excluído com sucesso");
    }

    private EventoResumoDTO toEventoResumo(Evento evento) {
        Turma turma = evento.getTurma();
        long totalAlunos = turma != null && turma.getId() != null ? alunoRepo.countByTurmaId(turma.getId()) : 0L;
        EventoPresencaResumo presencaResumo = resumoPresencasEvento(evento.getId(), totalAlunos);
        return new EventoResumoDTO(
            evento.getId(),
            evento.getNome(),
            evento.getDescricao(),
            evento.getDataEvento(),
            evento.getHorario(),
            evento.getLocalEvento(),
            evento.getTipo(),
            evento.getResponsavel(),
            evento.getStatus(),
            turma == null ? null : new EventoResumoDTO.TurmaResumo(turma.getId(), turma.getNome()),
            presencaResumo.presencas(),
            presencaResumo.talvez(),
            presencaResumo.faltas(),
            presencaResumo.pendentes()
        );
    }

    private EventoPresencaResumo resumoPresencasEvento(Long eventoId, long totalAlunos) {
        List<PresencaEvento> respostas = presencaEventoRepo.findAllByEventoId(eventoId);
        long presencas = respostas.stream()
            .filter(resposta -> "confirmado".equals(normalizeStatus(resposta.getStatus())))
            .count();
        long talvez = respostas.stream()
            .filter(resposta -> "talvez".equals(normalizeStatus(resposta.getStatus())))
            .count();
        long faltas = respostas.stream()
            .filter(resposta -> "nao vou".equals(normalizeStatus(resposta.getStatus())))
            .count();
        long alunosQueResponderam = respostas.stream()
            .map(PresencaEvento::getAluno)
            .filter(Objects::nonNull)
            .map(Aluno::getId)
            .filter(Objects::nonNull)
            .distinct()
            .count();

        return new EventoPresencaResumo(
            presencas,
            talvez,
            faltas,
            Math.max(totalAlunos - alunosQueResponderam, 0L)
        );
    }

    private String normalizeStatus(String status) {
        return normalizeText(status).toLowerCase().replaceAll("\\s+", " ");
    }

    private record EventoPresencaResumo(long presencas, long talvez, long faltas, long pendentes) {}

    @GetMapping("/financeiro")
    public List<LancamentoFinanceiro> listarFinanceiro() {
        return lancamentoRepo.findAll(Sort.by(
            Sort.Order.desc("dataLancamento"),
            Sort.Order.asc("descricao")
        ));
    }

    @PostMapping("/lancamento")
    public LancamentoFinanceiro criarLancamento(@RequestBody LancamentoInputDTO dto) {
        Turma turma = turmaRepo.findById(dto.turmaId()).orElseThrow();
        LancamentoFinanceiro lanc = new LancamentoFinanceiro();
        String tipo = resolveTipoFinanceiro(dto.tipo(), dto.valor());
        lanc.setDescricao(requireText(dto.descricao(), "Descricao do lancamento e obrigatoria."));
        lanc.setValor(normalizeMoneyMagnitude(dto.valor()));
        lanc.setTipo(tipo);
        lanc.setCategoria(resolveOption(dto.categoria(), "OUTROS", List.of("MENSALIDADE", "CONTRIBUICAO", "PATROCINIO", "RIFA", "EVENTO", "CONTRATO", "DECORACAO", "FOTO_VIDEO", "OUTROS")));
        lanc.setFormaPagamento(resolveOption(dto.formaPagamento(), "PIX", List.of("PIX", "DINHEIRO", "BOLETO", "CARTAO", "TRANSFERENCIA", "OUTROS")));
        lanc.setStatus(resolveOption(dto.status(), "CONFIRMADO", List.of("PENDENTE", "CONFIRMADO", "CANCELADO", "ESTORNADO")));
        lanc.setContribuicao(Boolean.TRUE.equals(dto.contribuicao()));
        lanc.setApoiadorNome(normalizeText(dto.apoiadorNome()));
        lanc.setDataLancamento(dto.data());
        lanc.setDataVencimento(dto.dataVencimento());
        lanc.setReferencia(normalizeText(dto.referencia()));
        lanc.setObservacao(normalizeText(firstNonBlank(dto.observacao(), dto.referencia())));
        lanc.setResponsavelLancamento(normalizeText(dto.responsavelLancamento()));
        lanc.setCampanha(resolveOption(dto.campanha(), "META_GERAL", List.of("META_GERAL", "RIFA", "PATROCINIO", "EVENTO", "OUTROS")));
        lanc.setAnonima(Boolean.TRUE.equals(dto.anonima()));
        lanc.setTurma(turma);
        if (dto.alunoId() != null) {
            alunoRepo.findById(dto.alunoId()).ifPresent(lanc::setAluno);
        }
        LancamentoFinanceiro salvo = lancamentoRepo.save(lanc);
        syncTurmaTotalArrecadado(turma);
        return salvo;
    }

    @PutMapping("/lancamento/{id}")
    public LancamentoFinanceiro atualizarLancamento(@PathVariable Long id, @RequestBody LancamentoInputDTO dto) {
        LancamentoFinanceiro lanc = lancamentoRepo.findById(id).orElseThrow();
        Long turmaAnteriorId = lanc.getTurma() != null ? lanc.getTurma().getId() : null;
        Turma turma = turmaRepo.findById(dto.turmaId()).orElseThrow();
        String tipo = resolveTipoFinanceiro(dto.tipo(), dto.valor());
        lanc.setDescricao(requireText(dto.descricao(), "Descricao do lancamento e obrigatoria."));
        lanc.setValor(normalizeMoneyMagnitude(dto.valor()));
        lanc.setTipo(tipo);
        lanc.setCategoria(resolveOption(dto.categoria(), firstNonBlank(lanc.getCategoria(), "OUTROS"), List.of("MENSALIDADE", "CONTRIBUICAO", "PATROCINIO", "RIFA", "EVENTO", "CONTRATO", "DECORACAO", "FOTO_VIDEO", "OUTROS")));
        lanc.setFormaPagamento(resolveOption(dto.formaPagamento(), firstNonBlank(lanc.getFormaPagamento(), "PIX"), List.of("PIX", "DINHEIRO", "BOLETO", "CARTAO", "TRANSFERENCIA", "OUTROS")));
        lanc.setStatus(resolveOption(dto.status(), firstNonBlank(lanc.getStatus(), "CONFIRMADO"), List.of("PENDENTE", "CONFIRMADO", "CANCELADO", "ESTORNADO")));
        lanc.setContribuicao(Boolean.TRUE.equals(dto.contribuicao()));
        lanc.setApoiadorNome(normalizeText(dto.apoiadorNome()));
        lanc.setDataLancamento(dto.data());
        lanc.setDataVencimento(dto.dataVencimento());
        lanc.setReferencia(normalizeText(dto.referencia()));
        lanc.setObservacao(normalizeText(firstNonBlank(dto.observacao(), dto.referencia())));
        lanc.setResponsavelLancamento(normalizeText(dto.responsavelLancamento()));
        lanc.setCampanha(resolveOption(dto.campanha(), firstNonBlank(lanc.getCampanha(), "META_GERAL"), List.of("META_GERAL", "RIFA", "PATROCINIO", "EVENTO", "OUTROS")));
        lanc.setAnonima(Boolean.TRUE.equals(dto.anonima()));
        lanc.setTurma(turma);
        if (dto.alunoId() != null) {
            alunoRepo.findById(dto.alunoId()).ifPresent(lanc::setAluno);
        } else {
            lanc.setAluno(null);
        }
        LancamentoFinanceiro salvo = lancamentoRepo.save(lanc);
        syncTurmaTotalArrecadado(turma);
        if (turmaAnteriorId != null && !turmaAnteriorId.equals(turma.getId())) {
            syncTurmaTotalArrecadado(turmaAnteriorId);
        }
        return salvo;
    }

    @DeleteMapping("/lancamento/{id}")
    public ResponseEntity<?> deletarLancamento(@PathVariable Long id) {
        LancamentoFinanceiro lancamento = lancamentoRepo.findById(id).orElse(null);
        if(lancamento == null) return ResponseEntity.notFound().build();
        Long turmaId = lancamento.getTurma() != null ? lancamento.getTurma().getId() : null;
        lancamentoRepo.delete(lancamento);
        syncTurmaTotalArrecadado(turmaId);
        return ResponseEntity.ok("Lancamento excluido com sucesso.");
    }

    @PutMapping("/lancamento/{id}/cancelar")
    public ResponseEntity<?> cancelarLancamento(@PathVariable Long id) {
        LancamentoFinanceiro lancamento = lancamentoRepo.findById(id).orElse(null);
        if(lancamento == null) return ResponseEntity.notFound().build();
        Long turmaId = lancamento.getTurma() != null ? lancamento.getTurma().getId() : null;
        lancamento.setStatus("CANCELADO");
        lancamentoRepo.save(lancamento);
        syncTurmaTotalArrecadado(turmaId);
        return ResponseEntity.ok("Lancamento cancelado com sucesso.");
    }

    @PutMapping("/lancamento/{id}/estornar")
    public ResponseEntity<?> estornarLancamento(@PathVariable Long id) {
        LancamentoFinanceiro lancamento = lancamentoRepo.findById(id).orElse(null);
        if(lancamento == null) return ResponseEntity.notFound().build();
        Long turmaId = lancamento.getTurma() != null ? lancamento.getTurma().getId() : null;
        lancamento.setStatus("ESTORNADO");
        lancamentoRepo.save(lancamento);
        syncTurmaTotalArrecadado(turmaId);
        return ResponseEntity.ok("Lancamento estornado com sucesso.");
    }

    @GetMapping("/votacoes")
    public List<VotacaoResultadoDTO> listarVotacoes() {
        List<Votacao> votacoes = votacaoRepo.findAll(Sort.by(
            Sort.Order.asc("dataFim"),
            Sort.Order.asc("titulo")
        ));
        Map<Long, Long> votosPorOpcao = buildVoteCountsByOpcao(votacoes);

        return votacoes.stream()
            .map(votacao -> toVotacaoResultado(votacao, votosPorOpcao))
            .toList();
    }

    @PostMapping("/votacao")
    public Votacao criarVotacao(@RequestBody VotacaoInputDTO dto) {
        Turma turma = turmaRepo.findById(dto.turmaId()).orElseThrow();
        Votacao vot = new Votacao();
        vot.setTitulo(requireText(dto.titulo(), "Titulo da votacao e obrigatorio."));
        vot.setDescricao(normalizeText(dto.descricao()));
        vot.setDataInicio(dto.dataInicio());
        vot.setDataFim(dto.dataFim());
        vot.setStatus(resolveOption(dto.status(), "ABERTA", List.of("RASCUNHO", "ABERTA", "ENCERRADA")));
        vot.setTipo(resolveOption(dto.tipo(), "ESCOLHA_UNICA", List.of("ESCOLHA_UNICA", "MULTIPLA_ESCOLHA")));
        vot.setVisibilidadeResultado(resolveOption(dto.visibilidadeResultado(), "APOS_ENCERRAMENTO", List.of("SEMPRE", "APOS_ENCERRAMENTO")));
        vot.setAnonima(dto.anonima() == null ? true : dto.anonima());
        vot.setQuorumMinimo(dto.quorumMinimo());
        vot.setTurma(turma);
        return votacaoRepo.save(vot);
    }

    @PutMapping("/votacao/{id}")
    public Votacao atualizarVotacao(@PathVariable Long id, @RequestBody VotacaoInputDTO dto) {
        Votacao vot = votacaoRepo.findById(id).orElseThrow();
        Turma turma = turmaRepo.findById(dto.turmaId()).orElseThrow();
        vot.setTitulo(requireText(dto.titulo(), "Titulo da votacao e obrigatorio."));
        vot.setDescricao(normalizeText(dto.descricao()));
        vot.setDataInicio(dto.dataInicio());
        vot.setDataFim(dto.dataFim());
        vot.setStatus(resolveOption(dto.status(), firstNonBlank(vot.getStatus(), "ABERTA"), List.of("RASCUNHO", "ABERTA", "ENCERRADA")));
        vot.setTipo(resolveOption(dto.tipo(), firstNonBlank(vot.getTipo(), "ESCOLHA_UNICA"), List.of("ESCOLHA_UNICA", "MULTIPLA_ESCOLHA")));
        vot.setVisibilidadeResultado(resolveOption(dto.visibilidadeResultado(), firstNonBlank(vot.getVisibilidadeResultado(), "APOS_ENCERRAMENTO"), List.of("SEMPRE", "APOS_ENCERRAMENTO")));
        vot.setAnonima(dto.anonima() == null ? Boolean.TRUE.equals(vot.getAnonima()) : dto.anonima());
        vot.setQuorumMinimo(dto.quorumMinimo());
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
        opcao.setNomeFornecedor(requireText(payload.get("nome"), "Nome da opcao e obrigatorio."));
        opcao.setDescricaoCurta(normalizeText(payload.get("descricaoCurta")));
        opcao.setDetalhesProposta(normalizeText(payload.get("detalhes")));
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

    private VotacaoResultadoDTO toVotacaoResultado(Votacao votacao, Map<Long, Long> votosPorOpcao) {
        List<OpcaoVotacao> opcoes = votacao.getOpcoes() == null ? List.of() : votacao.getOpcoes();
        long totalVotos = opcoes.stream()
            .mapToLong(opcao -> votosPorOpcao.getOrDefault(opcao.getId(), 0L))
            .sum();

        return new VotacaoResultadoDTO(
            votacao.getId(),
            firstNonBlank(votacao.getTitulo(), "Votação sem título"),
            votacao.getDescricao(),
            firstNonBlank(votacao.getStatus(), "aberta"),
            votacao.getDataInicio(),
            votacao.getDataFim(),
            firstNonBlank(votacao.getTipo(), "ESCOLHA_UNICA"),
            firstNonBlank(votacao.getVisibilidadeResultado(), "APOS_ENCERRAMENTO"),
            votacao.getAnonima(),
            votacao.getQuorumMinimo(),
            votacao.getTurma() == null ? null : new VotacaoResultadoDTO.TurmaResumo(
                votacao.getTurma().getId(),
                firstNonBlank(votacao.getTurma().getNome(), "Sem turma")
            ),
            totalVotos,
            opcoes.stream()
                .map(opcao -> {
                    long votos = votosPorOpcao.getOrDefault(opcao.getId(), 0L);
                    return new VotacaoResultadoDTO.OpcaoResultadoDTO(
                        opcao.getId(),
                        firstNonBlank(opcao.getNomeFornecedor(), "Opção sem nome"),
                        opcao.getDescricaoCurta(),
                        opcao.getDetalhesProposta(),
                        opcao.getValorProposta(),
                        votos,
                        totalVotos <= 0 ? 0.0 : roundPercent((votos * 100.0) / totalVotos)
                    );
                })
                .toList()
        );
    }

    private Map<Long, Long> buildVoteCountsByOpcao(List<Votacao> votacoes) {
        List<Long> votacaoIds = votacoes.stream()
            .map(Votacao::getId)
            .filter(id -> id != null)
            .toList();

        if (votacaoIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, Long> votosPorOpcao = new java.util.HashMap<>();
        for (Object[] row : votoRepo.countVotesByOpcaoForVotacoes(votacaoIds)) {
            if (row.length < 2 || row[0] == null || row[1] == null) continue;
            votosPorOpcao.merge(((Number) row[0]).longValue(), ((Number) row[1]).longValue(), Long::sum);
        }
        return votosPorOpcao;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s{2,}", " ");
    }

    private String requireText(String value, String message) {
        String normalized = normalizeText(value);
        if (normalized.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return normalized;
    }

    private String resolveOption(String value, String fallback, List<String> allowed) {
        String candidate = normalizeText(value).toUpperCase().replace('-', '_').replace(' ', '_');
        if (candidate.isBlank()) {
            candidate = normalizeText(fallback).toUpperCase().replace('-', '_').replace(' ', '_');
        }
        if (allowed.contains(candidate)) {
            return candidate;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Opcao invalida: " + value);
    }

    private String resolveEmailContato(String contato, String identificador) {
        String email = normalizeText(contato);
        return email.isBlank() ? identificador + "@gestaoform.local" : email;
    }

    private void syncTurmaTotalArrecadado(Turma turma) {
        if (turma == null || turma.getId() == null) return;
        double totalAtualizado = normalizeSignedMoney(lancamentoRepo.saldoByTurmaId(turma.getId()));
        if (Double.compare(normalizeSignedMoney(turma.getTotalArrecadado()), totalAtualizado) == 0) return;
        turma.setTotalArrecadado(totalAtualizado);
        turmaRepo.save(turma);
    }

    private void syncTurmaTotalArrecadado(Long turmaId) {
        if (turmaId == null) return;
        turmaRepo.findById(turmaId).ifPresent(this::syncTurmaTotalArrecadado);
    }

    private double normalizeMoney(Double value) {
        return roundMoney(Math.max(0.0, safeDouble(value)));
    }

    private double normalizeSignedMoney(Double value) {
        return roundMoney(safeDouble(value));
    }

    private double normalizeMoneyMagnitude(Double value) {
        return roundMoney(Math.abs(safeDouble(value)));
    }

    private String resolveTipoFinanceiro(String tipoInformado, Double valorInformado) {
        String tipo = normalizeText(tipoInformado).toLowerCase();
        if (tipo.isBlank()) {
            return safeDouble(valorInformado) < 0 ? "DESPESA" : "RECEITA";
        }
        if ("receita".equals(tipo) || "despesa".equals(tipo)) {
            return tipo.toUpperCase();
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de lançamento financeiro inválido.");
    }

    private double safeDouble(Double value) {
        return value == null ? 0.0 : value;
    }

    private double roundMoney(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private double roundPercent(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private String resolveSenhaCadastro(String senhaInformada) {
        if (senhaInformada == null || senhaInformada.isBlank()) {
            return SENHA_PADRAO_ALUNO;
        }
        return validateProvidedPassword(senhaInformada);
    }

    private String validateProvidedPassword(String senhaInformada) {
        String senha = senhaInformada.trim();
        if (senha.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A senha do aluno deve ter pelo menos 6 caracteres.");
        }
        return senha;
    }

    public record VotoInputRequest(Long votacaoId, Long opcaoId, Long alunoId) {}
}
