package br.com.senac.formatura.sistema_gerenciamento_formaturas.dto;
import java.time.LocalDate;

public record EventoInputDTO(
    String nome, 
    LocalDate data, 
    String local, 
    Long turmaId // O campo vital que faltava
) {}