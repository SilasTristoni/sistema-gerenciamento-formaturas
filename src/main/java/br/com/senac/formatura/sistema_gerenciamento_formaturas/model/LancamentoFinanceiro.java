package br.com.senac.formatura.sistema_gerenciamento_formaturas.model;

import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Data
@Entity
public class LancamentoFinanceiro {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String descricao;
    private String tipo; // receita, despesa
    private Double valor;
    private LocalDate data;
    private String referencia;
}