package br.com.senac.formatura.sistema_gerenciamento_formaturas.dto;
import java.time.LocalDate;
import java.time.LocalTime;

public record EventoInputDTO(
    String nome,
    String descricao,
    LocalDate data,
    LocalTime horario,
    String local,
    Long turmaId,
    String tipo,
    String responsavel,
    String status
) {}
