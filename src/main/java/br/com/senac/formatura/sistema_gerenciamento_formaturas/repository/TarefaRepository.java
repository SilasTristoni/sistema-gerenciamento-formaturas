package br.com.senac.formatura.sistema_gerenciamento_formaturas.repository;
import org.springframework.data.jpa.repository.JpaRepository;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Tarefa;

public interface TarefaRepository extends JpaRepository<Tarefa, Long> {}