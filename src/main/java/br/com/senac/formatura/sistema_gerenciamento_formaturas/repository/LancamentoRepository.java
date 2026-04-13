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

    @Query("SELECT COALESCE(SUM(l.valor), 0) FROM LancamentoFinanceiro l WHERE l.tipo = 'receita'")
    Double totalReceitas();

    @Query("SELECT COALESCE(SUM(l.valor), 0) FROM LancamentoFinanceiro l WHERE l.tipo = 'despesa'")
    Double totalDespesas();

    @Query("""
        SELECT COALESCE(SUM(l.valor), 0)
        FROM LancamentoFinanceiro l
        WHERE l.turma.id = :turmaId
          AND LOWER(l.tipo) = 'receita'
    """)
    Double totalReceitasByTurmaId(@Param("turmaId") Long turmaId);

    List<LancamentoFinanceiro> findByContribuicaoTrueOrderByDataLancamentoDescIdDesc();

    List<LancamentoFinanceiro> findByTurmaIdAndContribuicaoTrueOrderByDataLancamentoDescIdDesc(Long turmaId);

    List<LancamentoFinanceiro> findByAlunoIdAndContribuicaoTrueOrderByDataLancamentoDescIdDesc(Long alunoId);

    @Query("""
        SELECT l.turma.id, COUNT(l), COALESCE(SUM(l.valor), 0)
        FROM LancamentoFinanceiro l
        WHERE l.contribuicao = true
          AND l.turma.id IN :turmaIds
        GROUP BY l.turma.id
    """)
    List<Object[]> resumirContribuicoesPorTurma(@Param("turmaIds") Collection<Long> turmaIds);
}
