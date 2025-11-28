package br.com.senac.formatura.sistema_gerenciamento_formaturas.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Data;

@Data
@Entity
public class Tarefa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "turma_id", nullable = false)
    private Turma turma;

    @ManyToOne
    @JoinColumn(name = "responsavel_id")
    private Aluno responsavel;

    private String titulo;
    
    @Column(columnDefinition = "TEXT")
    private String descricao;
    
    private String status = "a_fazer";
    private LocalDate dataLimite;
}