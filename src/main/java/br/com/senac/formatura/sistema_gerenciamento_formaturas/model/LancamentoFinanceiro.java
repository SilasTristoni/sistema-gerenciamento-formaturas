package br.com.senac.formatura.sistema_gerenciamento_formaturas.model;

import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Data;

@Data
@Entity
public class LancamentoFinanceiro {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // RELACIONAMENTO NOVO: Obrigatório (toda conta é de uma turma)
    @ManyToOne
    @JoinColumn(name = "turma_id", nullable = false)
    private Turma turma;

    // RELACIONAMENTO NOVO: Opcional (pode ser pagamento de um aluno específico)
    @ManyToOne
    @JoinColumn(name = "aluno_id", nullable = true)
    private Aluno aluno;

    private String descricao;
    private String tipo; // receita, despesa
    private Double valor;
    private LocalDate dataLancamento; // Renomeado para bater com SQL
    private String referencia;
}