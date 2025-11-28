package br.com.senac.formatura.sistema_gerenciamento_formaturas.repository;
import org.springframework.data.jpa.repository.JpaRepository;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Voto;

public interface VotoRepository extends JpaRepository<Voto, Long> {}