package br.com.senac.formatura.sistema_gerenciamento_formaturas.model;

import java.time.LocalDate;
import java.util.List;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
public class Votacao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "turma_id", nullable = false)
    private Turma turma;

    private String titulo;
    private String descricao;
    private LocalDate dataInicio;
    private String status = "ABERTA";
    private String tipo = "ESCOLHA_UNICA";
    private String visibilidadeResultado = "APOS_ENCERRAMENTO";
    private Boolean anonima = true;
    private Integer quorumMinimo;
    private LocalDate dataFim;

    @OneToMany(mappedBy = "votacao", cascade = CascadeType.ALL)
    private List<OpcaoVotacao> opcoes;
}
