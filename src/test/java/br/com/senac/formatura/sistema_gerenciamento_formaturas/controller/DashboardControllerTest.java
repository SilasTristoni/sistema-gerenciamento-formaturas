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

import br.com.senac.formatura.sistema_gerenciamento_formaturas.dto.DashboardResumoDTO;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Aluno;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Turma;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.AlunoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.EventoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.LancamentoRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.TurmaRepository;
import br.com.senac.formatura.sistema_gerenciamento_formaturas.repository.VotacaoRepository;

@ExtendWith(MockitoExtension.class)
class DashboardControllerTest {

    @Mock private LancamentoRepository lancamentoRepository;
    @Mock private AlunoRepository alunoRepository;
    @Mock private TurmaRepository turmaRepository;
    @Mock private EventoRepository eventoRepository;
    @Mock private VotacaoRepository votacaoRepository;

    @InjectMocks
    private DashboardController controller;

    @Test
    void resumoDeveCalcularQuantidadePorTurmaSemAcessarColecaoLazy() {
        Turma turma = new Turma();
        turma.setId(3L);
        turma.setNome("Turma 3");
        turma.setCurso("Gestao");
        turma.setMetaArrecadacao(100.0);
        turma.setTotalArrecadado(25.0);
        turma.setAlunos(lazyList());

        Aluno aluno1 = new Aluno();
        aluno1.setId(1L);
        aluno1.setTurma(turma);

        Aluno aluno2 = new Aluno();
        aluno2.setId(2L);
        aluno2.setTurma(turma);

        when(turmaRepository.findAll()).thenReturn(List.of(turma));
        when(alunoRepository.findAll()).thenReturn(List.of(aluno1, aluno2));
        when(eventoRepository.findAll()).thenReturn(List.of());
        when(lancamentoRepository.findAll()).thenReturn(List.of());
        when(votacaoRepository.findAll()).thenReturn(List.of());

        DashboardResumoDTO response = controller.getResumo(null, 6);

        assertThat(response.overview().totalAlunos()).isEqualTo(2);
        assertThat(response.topTurmas()).singleElement().satisfies(item -> {
            assertThat(item.quantidadeAlunos()).isEqualTo(2);
            assertThat(item.nome()).isEqualTo("Turma 3");
        });
        assertThat(response.goalProgress().sugestaoContribuicaoMedia()).isEqualTo(50.0);
    }

    private List<Aluno> lazyList() {
        return new AbstractList<>() {
            @Override
            public Aluno get(int index) {
                throw new UnsupportedOperationException();
            }

            @Override
            public int size() {
                throw new LazyInitializationException("colecao lazy nao inicializada");
            }
        };
    }
}
