package br.com.senac.formatura.sistema_gerenciamento_formaturas.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Aluno;

@Repository
public interface AlunoRepository extends JpaRepository<Aluno, Long> {
}