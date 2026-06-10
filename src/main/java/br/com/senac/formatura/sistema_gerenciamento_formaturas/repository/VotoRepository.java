package br.com.senac.formatura.sistema_gerenciamento_formaturas.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Voto;

@Repository
public interface VotoRepository extends JpaRepository<Voto, Long> {
    // Verifica se já existe um voto deste aluno nesta votação específica
    boolean existsByVotacaoIdAndAlunoId(Long votacaoId, Long alunoId);
    List<Voto> findAllByAlunoId(Long alunoId);

    @Query("""
        SELECT v.opcao.id, COUNT(v.id)
        FROM Voto v
        WHERE v.votacao.id IN :votacaoIds
        GROUP BY v.opcao.id
        """)
    List<Object[]> countVotesByOpcaoForVotacoes(@Param("votacaoIds") Collection<Long> votacaoIds);
}
