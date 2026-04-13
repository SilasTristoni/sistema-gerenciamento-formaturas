package br.com.senac.formatura.sistema_gerenciamento_formaturas.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Evento;

@Repository
public interface EventoRepository extends JpaRepository<Evento, Long> {
    List<Evento> findByTurmaIdOrderByDataEventoAscNomeAsc(Long turmaId);
}
