package br.com.senac.formatura.sistema_gerenciamento_formaturas.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.PresencaEvento;

public interface PresencaEventoRepository extends JpaRepository<PresencaEvento, Long> {
    Optional<PresencaEvento> findByEventoIdAndAlunoId(Long eventoId, Long alunoId);
    List<PresencaEvento> findAllByAlunoId(Long alunoId);
}
