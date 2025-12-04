package br.com.senac.formatura.sistema_gerenciamento_formaturas.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Voto;

@Repository
public interface VotoRepository extends JpaRepository<Voto, Long> {
    // Verifica se já existe um voto deste aluno nesta votação específica
    boolean existsByVotacaoIdAndAlunoId(Long votacaoId, Long alunoId);
}