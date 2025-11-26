package br.com.senac.formatura.sistema_gerenciamento_formaturas.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.com.senac.formatura.sistema_gerenciamento_formaturas.model.Evento;

// ATENÇÃO: Tem que ser 'interface' e ter o 'extends JpaRepository'
@Repository
public interface EventoRepository extends JpaRepository<Evento, Long> {
}