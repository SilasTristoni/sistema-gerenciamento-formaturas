package br.com.senac.formatura.sistema_gerenciamento_formaturas;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Aluno;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Evento;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.LancamentoFinanceiro;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Perfil;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Turma;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Usuario;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.AlunoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.EventoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.LancamentoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.TurmaRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.UsuarioRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.VotacaoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.service.TokenService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SistemaGerenciamentoFormaturasApplicationTests {

    @Autowired private MockMvc mockMvc;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private TokenService tokenService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private AlunoRepository alunoRepository;
    @Autowired private TurmaRepository turmaRepository;
    @Autowired private EventoRepository eventoRepository;
    @Autowired private VotacaoRepository votacaoRepository;
    @Autowired private LancamentoRepository lancamentoRepository;

    @BeforeEach
    void cleanDatabase() {
        usuarioRepository.deleteAll();
        lancamentoRepository.deleteAll();
        votacaoRepository.deleteAll();
        eventoRepository.deleteAll();
        alunoRepository.deleteAll();
        turmaRepository.deleteAll();
    }

    @Test
    void loginReturnsJwtForCommissionUser() throws Exception {
        createCommissionUser("comissao-login", "comissao@example.com", "senha-segura");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"login":"comissao@example.com","senha":"senha-segura"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").isNotEmpty())
            .andExpect(jsonPath("$.perfil").value("ROLE_COMISSAO"))
            .andExpect(jsonPath("$.nome").value("Admin"));
    }

    @Test
    void dashboardResumoReturnsMetricsForCommissionScope() throws Exception {
        Usuario comissao = createCommissionUser("gestor", "gestor@example.com", "senha-segura");
        Turma turma = createTurma("ADS 2026", 1000.0);
        createLancamento(turma, "Patrocinio inicial", "receita", 300.0, LocalDate.now().minusDays(2), "Apoio");
        createLancamento(turma, "Reserva de espaco", "despesa", 50.0, LocalDate.now().minusDays(1), "Contrato");
        createEvento(turma, "Reuniao geral", LocalDate.now().plusDays(5), "Auditorio");

        mockMvc.perform(get("/api/dashboard/resumo")
                .header("Authorization", bearer(comissao)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.overview.totalReceitas").value(300.0))
            .andExpect(jsonPath("$.overview.totalDespesas").value(50.0))
            .andExpect(jsonPath("$.goalProgress.valorMeta").value(1000.0))
            .andExpect(jsonPath("$.goalProgress.valorArrecadado").value(300.0))
            .andExpect(jsonPath("$.goalProgress.metaDefinida").value(true))
            .andExpect(jsonPath("$.notifications").isArray());
    }

    @Test
    void contributionSummaryForStudentIsAlwaysScopedToOwnTurma() throws Exception {
        Turma turmaAluno = createTurma("Marketing", 1200.0);
        Turma outraTurma = createTurma("Design", 800.0);
        Usuario aluno = createStudentUser("maria.login", "maria@example.com", "senha-segura", "Maria", turmaAluno);

        createContribution(turmaAluno, aluno.getAluno(), "Apoio familia", 200.0, "Familia Maria", false);
        createContribution(outraTurma, null, "Apoio externo", 500.0, "Patrocinador", false);

        mockMvc.perform(get("/api/contribuicoes/resumo")
                .param("turmaId", String.valueOf(outraTurma.getId()))
                .header("Authorization", bearer(aluno)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.summary.totalContribuicoes").value(200.0))
            .andExpect(jsonPath("$.summary.quantidadeContribuicoes").value(1))
            .andExpect(jsonPath("$.summary.scopeLabel").value("Contribuicoes da sua turma"))
            .andExpect(jsonPath("$.turmas.length()").value(1))
            .andExpect(jsonPath("$.turmas[0].turmaNome").value("Marketing"));
    }

    @Test
    void studentCanRegisterAnonymousContributionAndUpdateTurmaTotal() throws Exception {
        Turma turma = createTurma("Eventos", 1500.0);
        Usuario aluno = createStudentUser("ana.login", "ana@example.com", "senha-segura", "Ana", turma);

        mockMvc.perform(post("/api/contribuicoes")
                .header("Authorization", bearer(aluno))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"titulo":"Contribuicao espontanea","valor":180.0,"data":"%s","mensagem":"Apoio para a meta","anonima":true}
                    """.formatted(LocalDate.now())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").value("Contribuicao registrada com sucesso."));

        Turma turmaAtualizada = turmaRepository.findById(turma.getId()).orElseThrow();
        LancamentoFinanceiro contribuicao = lancamentoRepository.findByTurmaIdAndContribuicaoTrueOrderByDataLancamentoDescIdDesc(turma.getId())
            .stream()
            .findFirst()
            .orElseThrow();

        org.junit.jupiter.api.Assertions.assertEquals(180.0, turmaAtualizada.getTotalArrecadado());
        org.junit.jupiter.api.Assertions.assertEquals("Contribuicao anonima", contribuicao.getApoiadorNome());
        org.junit.jupiter.api.Assertions.assertTrue(Boolean.TRUE.equals(contribuicao.getContribuicao()));
    }

    private Usuario createCommissionUser(String login, String email, String senha) {
        Usuario usuario = new Usuario();
        usuario.setLogin(login);
        usuario.setEmail(email);
        usuario.setSenha(passwordEncoder.encode(senha));
        usuario.setPerfil(Perfil.ROLE_COMISSAO);
        return usuarioRepository.save(usuario);
    }

    private Usuario createStudentUser(String login, String email, String senha, String nome, Turma turma) {
        Aluno aluno = new Aluno();
        aluno.setNome(nome);
        aluno.setIdentificador(login);
        aluno.setContato(nome.toLowerCase().replace(' ', '.') + "@example.com");
        aluno.setTurma(turma);
        aluno = alunoRepository.save(aluno);

        Usuario usuario = new Usuario();
        usuario.setLogin(login);
        usuario.setEmail(email);
        usuario.setSenha(passwordEncoder.encode(senha));
        usuario.setPerfil(Perfil.ROLE_ALUNO);
        usuario.setAluno(aluno);
        return usuarioRepository.save(usuario);
    }

    private Turma createTurma(String nome, double meta) {
        Turma turma = new Turma();
        turma.setNome(nome);
        turma.setCurso(nome + " Curso");
        turma.setInstituicao("Senac");
        turma.setMetaArrecadacao(meta);
        turma.setTotalArrecadado(0.0);
        return turmaRepository.save(turma);
    }

    private Evento createEvento(Turma turma, String nome, LocalDate data, String local) {
        Evento evento = new Evento();
        evento.setTurma(turma);
        evento.setNome(nome);
        evento.setDataEvento(data);
        evento.setLocalEvento(local);
        return eventoRepository.save(evento);
    }

    private LancamentoFinanceiro createLancamento(
        Turma turma,
        String descricao,
        String tipo,
        double valor,
        LocalDate data,
        String referencia
    ) {
        LancamentoFinanceiro lancamento = new LancamentoFinanceiro();
        lancamento.setTurma(turma);
        lancamento.setDescricao(descricao);
        lancamento.setTipo(tipo);
        lancamento.setValor(valor);
        lancamento.setDataLancamento(data);
        lancamento.setReferencia(referencia);
        return lancamentoRepository.save(lancamento);
    }

    private LancamentoFinanceiro createContribution(
        Turma turma,
        Aluno aluno,
        String titulo,
        double valor,
        String apoiadorNome,
        boolean anonima
    ) {
        LancamentoFinanceiro lancamento = new LancamentoFinanceiro();
        lancamento.setTurma(turma);
        lancamento.setAluno(aluno);
        lancamento.setTipo("receita");
        lancamento.setDescricao(titulo);
        lancamento.setValor(valor);
        lancamento.setDataLancamento(LocalDate.now());
        lancamento.setContribuicao(true);
        lancamento.setApoiadorNome(anonima ? "Contribuicao anonima" : apoiadorNome);
        LancamentoFinanceiro salvo = lancamentoRepository.save(lancamento);
        turma.setTotalArrecadado((turma.getTotalArrecadado() == null ? 0.0 : turma.getTotalArrecadado()) + valor);
        turmaRepository.save(turma);
        return salvo;
    }

    private String bearer(Usuario usuario) {
        return "Bearer " + tokenService.gerarToken(usuario);
    }
}
