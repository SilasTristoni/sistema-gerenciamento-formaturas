package br.com.senac.formatura.sistema_gerenciamento_formaturas.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.LancamentoFinanceiro;

@Repository
public interface LancamentoRepository extends JpaRepository<LancamentoFinanceiro, Long> {

    // Soma total de receitas (evita null com COALESCE)
    @Query("SELECT COALESCE(SUM(l.valor), 0) FROM LancamentoFinanceiro l WHERE l.tipo = 'receita'")
    Double totalReceitas();

    // Soma total de despesas
    @Query("SELECT COALESCE(SUM(l.valor), 0) FROM LancamentoFinanceiro l WHERE l.tipo = 'despesa'")
    Double totalDespesas();
}