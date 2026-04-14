package br.com.senac.formatura.sistema_gerenciamento_formaturas.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.AbstractList;
import java.util.List;

import org.hibernate.LazyInitializationException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.AlunoPainelResponseDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Aluno;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Perfil;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Turma;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Usuario;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.AlunoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.EventoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.LancamentoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.PresencaEventoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.VotacaoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.VotoRepository;

@ExtendWith(MockitoExtension.class)
class AlunoPortalControllerTest {

    @Mock private AlunoRepository alunoRepository;
    @Mock private EventoRepository eventoRepository;
    @Mock private VotacaoRepository votacaoRepository;
    @Mock private PresencaEventoRepository presencaEventoRepository;
    @Mock private VotoRepository votoRepository;
    @Mock private LancamentoRepository lancamentoRepository;

    @InjectMocks
    private AlunoPortalController controller;

    @Test
    void painelDeveUsarContagemDoRepositorioSemInicializarColecaoLazyDaTurma() {
        Turma turma = new Turma();
        turma.setId(7L);
        turma.setNome("ADS 2026");
        turma.setCurso("Analise e Desenvolvimento de Sistemas");
        turma.setMetaArrecadacao(100.0);
        turma.setAlunos(lazyList());

        Aluno aluno = new Aluno();
        aluno.setId(9L);
        aluno.setNome("Aluno Teste");
        aluno.setIdentificador("A001");
        aluno.setContato("11999999999");
        aluno.setTurma(turma);

        Usuario usuario = new Usuario();
        usuario.setPerfil(Perfil.ROLE_ALUNO);
        usuario.setAluno(aluno);

        when(eventoRepository.findByTurmaIdOrderByDataEventoAscNomeAsc(7L)).thenReturn(List.of());
        when(votacaoRepository.findByTurmaIdOrderByDataFimAscTituloAsc(7L)).thenReturn(List.of());
        when(presencaEventoRepository.findAllByAlunoId(9L)).thenReturn(List.of());
        when(votoRepository.findAllByAlunoId(9L)).thenReturn(List.of());
        when(lancamentoRepository.totalReceitasByTurmaId(7L)).thenReturn(40.0);
        when(alunoRepository.countByTurmaId(7L)).thenReturn(4L);

        ResponseEntity<?> response = controller.painel(usuario);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isInstanceOf(AlunoPainelResponseDTO.class);

        AlunoPainelResponseDTO body = (AlunoPainelResponseDTO) response.getBody();
        assertThat(body.financeiro().sugestaoContribuicaoMedia()).isEqualTo(15.0);
        assertThat(body.aluno().turmaNome()).isEqualTo("ADS 2026");
    }

    private List<br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Aluno> lazyList() {
        return new AbstractList<>() {
            @Override
            public br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Aluno get(int index) {
                throw new UnsupportedOperationException();
            }

            @Override
            public int size() {
                throw new LazyInitializationException("colecao lazy nao inicializada");
            }
        };
    }
}
