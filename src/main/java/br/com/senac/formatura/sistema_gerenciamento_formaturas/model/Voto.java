package br.com.senac.formatura.sistema_gerenciamento_formaturas.model;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;

@Data
@Entity
@Table(uniqueConstraints = {
    @UniqueConstraint(columnNames = {"votacao_id", "aluno_id"}) 
    // Garante que o aluno só vote uma vez por votação
})
public class Voto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "votacao_id", nullable = false)
    private Votacao votacao;

    @ManyToOne
    @JoinColumn(name = "opcao_id", nullable = false)
    private OpcaoVotacao opcao;

    @ManyToOne
    @JoinColumn(name = "aluno_id", nullable = false)
    private Aluno aluno;

    private LocalDateTime dataVoto = LocalDateTime.now();
}