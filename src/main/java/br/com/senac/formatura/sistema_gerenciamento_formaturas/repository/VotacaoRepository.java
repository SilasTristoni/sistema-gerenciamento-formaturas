package br.com.senac.formatura.sistema_gerenciamento_formaturas.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Votacao;

@Repository
public interface VotacaoRepository extends JpaRepository<Votacao, Long> {
}