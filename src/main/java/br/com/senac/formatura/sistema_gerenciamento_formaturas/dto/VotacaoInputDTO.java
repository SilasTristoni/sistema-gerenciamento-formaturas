package br.com.senac.formatura.sistema_gerenciamento_formaturas.dto;
import java.time.LocalDate;

public record VotacaoInputDTO(String titulo, LocalDate dataFim, Long turmaId) {}