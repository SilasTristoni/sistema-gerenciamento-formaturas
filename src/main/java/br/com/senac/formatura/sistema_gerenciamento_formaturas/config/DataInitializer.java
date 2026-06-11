package br.com.senac.formatura.sistema_gerenciamento_formaturas.config;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Aluno;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Evento;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.LancamentoFinanceiro;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.OpcaoVotacao;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Perfil;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Turma;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Usuario;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Votacao;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.AlunoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.EventoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.LancamentoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.OpcaoVotacaoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.TurmaRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.UsuarioRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.VotacaoRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private TurmaRepository turmaRepository;
    @Autowired private AlunoRepository alunoRepository;
    @Autowired private EventoRepository eventoRepository;
    @Autowired private LancamentoRepository lancamentoRepository;
    @Autowired private VotacaoRepository votacaoRepository;
    @Autowired private OpcaoVotacaoRepository opcaoVotacaoRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.create-default-admin:true}")
    private boolean createDefaultAdmin;

    @Value("${app.bootstrap.default-admin-email:admin@gestaoform.com}")
    private String defaultAdminEmail;

    @Value("${app.bootstrap.default-admin-password:admin123}")
    private String defaultAdminPassword;

    @Override
    public void run(String... args) {
        if (createDefaultAdmin) {
            ensureCommissionUser("admin", defaultAdminEmail, defaultAdminPassword);
        }

        Turma turmaAds = ensureTurmaAds();

        Aluno ana = ensureAluno(turmaAds, "Ana Souza", "ana.souza", "ana.souza@example.com", "(47) 99911-2200", "ATIVO");
        Aluno bruno = ensureAluno(turmaAds, "Bruno Lima", "bruno.lima", "bruno.lima@example.com", "(47) 99922-3300", "ATIVO");
        Aluno camila = ensureAluno(turmaAds, "Camila Rocha", "camila.rocha", "camila.rocha@example.com", "", "PENDENTE");
        ensureStudentUser(ana, "aluno123");
        ensureStudentUser(bruno, "aluno123");
        ensureStudentUser(camila, "aluno123");

        ensureEvento(turmaAds, "Reuniao geral da turma", "REUNIAO_GERAL", LocalDate.now().plusDays(5), LocalTime.of(19, 30), "Sala 204 - Senac Joinville", "Ana Souza");
        ensureEvento(turmaAds, "Ensaio de colacao", "ENSAIO", LocalDate.now().plusDays(25), LocalTime.of(18, 0), "Auditorio principal", "Comissao");
        ensureEvento(turmaAds, "Prazo final da mensalidade", "PAGAMENTO", LocalDate.now().plusDays(12), LocalTime.of(23, 59), "Pagamento via PIX", "Tesouraria");

        ensureLancamento(turmaAds, ana, "Mensalidade Ana Souza", "RECEITA", "MENSALIDADE", "PIX", "CONFIRMADO", 250.0, true, "META_GERAL");
        ensureLancamento(turmaAds, bruno, "Mensalidade Bruno Lima", "RECEITA", "MENSALIDADE", "PIX", "PENDENTE", 250.0, true, "META_GERAL");
        ensureLancamento(turmaAds, null, "Patrocinio comercio local", "RECEITA", "PATROCINIO", "TRANSFERENCIA", "CONFIRMADO", 1500.0, true, "PATROCINIO");
        ensureLancamento(turmaAds, null, "Sinal contrato fotografia", "DESPESA", "FOTO_VIDEO", "PIX", "CONFIRMADO", 800.0, false, "OUTROS");

        ensureVotacoes(turmaAds);
        LOGGER.info("Dados iniciais verificados para a turma ADS 2026.");
    }

    private Usuario ensureCommissionUser(String login, String email, String password) {
        return usuarioRepository.findUsuarioByLogin(login)
            .or(() -> usuarioRepository.findUsuarioByEmail(email))
            .orElseGet(() -> {
                Usuario usuario = new Usuario();
                usuario.setLogin(login);
                usuario.setEmail(email);
                usuario.setSenha(passwordEncoder.encode(password));
                usuario.setPerfil(Perfil.ROLE_COMISSAO);
                return usuarioRepository.save(usuario);
            });
    }

    private Turma ensureTurmaAds() {
        return turmaRepository.findAll().stream()
            .filter(turma -> "ADS 2026".equalsIgnoreCase(turma.getNome()))
            .findFirst()
            .map(this::atualizarTurmaInicial)
            .orElseGet(() -> atualizarTurmaInicial(new Turma()));
    }

    private Turma atualizarTurmaInicial(Turma turma) {
        turma.setNome("ADS 2026");
        turma.setCurso("Analise e Desenvolvimento de Sistemas");
        turma.setInstituicao("Senac Joinville");
        turma.setAnoSemestre("2026/2");
        turma.setRepresentante("Ana Souza");
        turma.setMetaArrecadacao(30000.0);
        turma.setStatus("ATIVA");
        return turmaRepository.save(turma);
    }

    private Aluno ensureAluno(Turma turma, String nome, String identificador, String email, String whatsapp, String status) {
        Aluno aluno = alunoRepository.findByIdentificador(identificador);
        if (aluno == null) {
            aluno = new Aluno();
            aluno.setIdentificador(identificador);
            aluno.setPrecisaTrocarSenha(true);
        }
        aluno.setNome(nome);
        aluno.setEmail(email);
        aluno.setWhatsapp(whatsapp);
        aluno.setContato(!email.isBlank() ? email : whatsapp);
        aluno.setStatus(status);
        aluno.setTurma(turma);
        return alunoRepository.save(aluno);
    }

    private void ensureStudentUser(Aluno aluno, String password) {
        usuarioRepository.findByAlunoId(aluno.getId()).orElseGet(() -> {
            Usuario usuario = new Usuario();
            usuario.setLogin(aluno.getIdentificador());
            usuario.setEmail(aluno.getEmail());
            usuario.setSenha(passwordEncoder.encode(password));
            usuario.setPerfil(Perfil.ROLE_ALUNO);
            usuario.setAluno(aluno);
            return usuarioRepository.save(usuario);
        });
    }

    private void ensureEvento(Turma turma, String nome, String tipo, LocalDate data, LocalTime horario, String local, String responsavel) {
        boolean exists = eventoRepository.findAll().stream()
            .anyMatch(evento -> nome.equalsIgnoreCase(evento.getNome()));
        if (exists) return;

        Evento evento = new Evento();
        evento.setTurma(turma);
        evento.setNome(nome);
        evento.setDescricao("Compromisso para acompanhamento da comissao e dos formandos.");
        evento.setTipo(tipo);
        evento.setDataEvento(data);
        evento.setHorario(horario);
        evento.setLocalEvento(local);
        evento.setResponsavel(responsavel);
        evento.setStatus("AGENDADO");
        eventoRepository.save(evento);
    }

    private void ensureLancamento(
        Turma turma,
        Aluno aluno,
        String descricao,
        String tipo,
        String categoria,
        String formaPagamento,
        String status,
        double valor,
        boolean contribuicao,
        String campanha
    ) {
        boolean exists = lancamentoRepository.findAll().stream()
            .anyMatch(lancamento -> descricao.equalsIgnoreCase(lancamento.getDescricao()));
        if (exists) return;

        LancamentoFinanceiro lancamento = new LancamentoFinanceiro();
        lancamento.setTurma(turma);
        lancamento.setAluno(aluno);
        lancamento.setDescricao(descricao);
        lancamento.setTipo(tipo);
        lancamento.setCategoria(categoria);
        lancamento.setFormaPagamento(formaPagamento);
        lancamento.setStatus(status);
        lancamento.setValor(valor);
        lancamento.setDataLancamento(LocalDate.now().minusDays("DESPESA".equals(tipo) ? 7 : 2));
        lancamento.setDataVencimento("PENDENTE".equals(status) ? LocalDate.now().plusDays(8) : null);
        lancamento.setContribuicao(contribuicao);
        lancamento.setCampanha(campanha);
        lancamento.setApoiadorNome(aluno != null ? aluno.getNome() : "Apoiador da turma");
        lancamento.setReferencia(categoria);
        lancamento.setObservacao("Registro inicial do sistema.");
        lancamentoRepository.save(lancamento);
        turma.setTotalArrecadado(lancamentoRepository.saldoByTurmaId(turma.getId()));
        turmaRepository.save(turma);
    }

    private void ensureVotacoes(Turma turma) {
        Votacao fornecedores = ensureVotacao(turma, "Escolha do fornecedor de becas", "ABERTA", LocalDate.now().minusDays(1), LocalDate.now().plusDays(10));
        ensureOpcao(fornecedores, "Fornecedor Alpha", "Pacote completo com prova presencial");
        ensureOpcao(fornecedores, "Fornecedor Beta", "Melhor preco para pagamento antecipado");

        Votacao musica = ensureVotacao(turma, "Musica de entrada da turma", "ENCERRADA", LocalDate.now().minusDays(20), LocalDate.now().minusDays(3));
        ensureOpcao(musica, "Tema classico", "Entrada solene");
        ensureOpcao(musica, "Tema moderno", "Entrada descontraida");
    }

    private Votacao ensureVotacao(Turma turma, String titulo, String status, LocalDate inicio, LocalDate fim) {
        return votacaoRepository.findAll().stream()
            .filter(votacao -> titulo.equalsIgnoreCase(votacao.getTitulo()))
            .findFirst()
            .orElseGet(() -> {
                Votacao votacao = new Votacao();
                votacao.setTurma(turma);
                votacao.setTitulo(titulo);
                votacao.setDescricao("Votacao para apoiar decisoes da turma.");
                votacao.setStatus(status);
                votacao.setTipo("ESCOLHA_UNICA");
                votacao.setDataInicio(inicio);
                votacao.setDataFim(fim);
                votacao.setVisibilidadeResultado("APOS_ENCERRAMENTO");
                votacao.setAnonima(true);
                votacao.setQuorumMinimo(3);
                return votacaoRepository.save(votacao);
            });
    }

    private void ensureOpcao(Votacao votacao, String nome, String descricao) {
        List<OpcaoVotacao> opcoes = votacao.getOpcoes();
        if (opcoes != null && opcoes.stream().anyMatch(opcao -> nome.equalsIgnoreCase(opcao.getNomeFornecedor()))) {
            return;
        }
        OpcaoVotacao opcao = new OpcaoVotacao();
        opcao.setVotacao(votacao);
        opcao.setNomeFornecedor(nome);
        opcao.setDescricaoCurta(descricao);
        opcao.setDetalhesProposta(descricao);
        opcaoVotacaoRepository.save(opcao);
    }
}
