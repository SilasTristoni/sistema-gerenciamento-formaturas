package br.com.senac.formatura.sistema_gerenciamento_formaturas.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

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
public class OpcaoVotacao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "votacao_id", nullable = false)
    @JsonIgnore // <--- Essa anotação salva a sua API de travar!
    private Votacao votacao;

    private String nomeFornecedor;
    
    @Column(columnDefinition = "TEXT")
    private String detalhesProposta;
    
    private Double valorProposta;
}