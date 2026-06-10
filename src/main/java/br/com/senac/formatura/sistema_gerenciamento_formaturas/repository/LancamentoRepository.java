package br.com.senac.formatura.sistema_gerenciamento_formaturas.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.LancamentoFinanceiro;

@Repository
public interface LancamentoRepository extends JpaRepository<LancamentoFinanceiro, Long> {

    @Query("""
        SELECT COALESCE(SUM(l.valor), 0)
        FROM LancamentoFinanceiro l
        WHERE LOWER(l.tipo) = 'receita'
          AND (l.status IS NULL OR UPPER(l.status) NOT IN ('PENDENTE', 'CANCELADO', 'ESTORNADO'))
    """)
    Double totalReceitas();

    @Query("""
        SELECT COALESCE(SUM(l.valor), 0)
        FROM LancamentoFinanceiro l
        WHERE LOWER(l.tipo) = 'despesa'
          AND (l.status IS NULL OR UPPER(l.status) NOT IN ('PENDENTE', 'CANCELADO', 'ESTORNADO'))
    """)
    Double totalDespesas();

    @Query("""
        SELECT COALESCE(SUM(l.valor), 0)
        FROM LancamentoFinanceiro l
        WHERE l.turma.id = :turmaId
          AND LOWER(l.tipo) = 'receita'
          AND (l.status IS NULL OR UPPER(l.status) NOT IN ('PENDENTE', 'CANCELADO', 'ESTORNADO'))
    """)
    Double totalReceitasByTurmaId(@Param("turmaId") Long turmaId);

    @Query("""
        SELECT COALESCE(SUM(
            CASE
                WHEN LOWER(l.tipo) = 'receita' THEN l.valor
                WHEN LOWER(l.tipo) = 'despesa' THEN -l.valor
                ELSE 0
            END
        ), 0)
        FROM LancamentoFinanceiro l
        WHERE l.turma.id = :turmaId
          AND (l.status IS NULL OR UPPER(l.status) NOT IN ('PENDENTE', 'CANCELADO', 'ESTORNADO'))
    """)
    Double saldoByTurmaId(@Param("turmaId") Long turmaId);

    List<LancamentoFinanceiro> findByContribuicaoTrueOrderByDataLancamentoDescIdDesc();

    List<LancamentoFinanceiro> findByTurmaIdAndContribuicaoTrueOrderByDataLancamentoDescIdDesc(Long turmaId);

    List<LancamentoFinanceiro> findByAlunoIdAndContribuicaoTrueOrderByDataLancamentoDescIdDesc(Long alunoId);

    @Query("""
        SELECT l.turma.id, COUNT(l), COALESCE(SUM(l.valor), 0)
        FROM LancamentoFinanceiro l
        WHERE l.contribuicao = true
          AND l.turma.id IN :turmaIds
          AND (l.status IS NULL OR UPPER(l.status) = 'CONFIRMADO')
        GROUP BY l.turma.id
    """)
    List<Object[]> resumirContribuicoesPorTurma(@Param("turmaIds") Collection<Long> turmaIds);
}
