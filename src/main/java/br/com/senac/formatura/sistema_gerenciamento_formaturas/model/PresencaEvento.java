package br.com.senac.formatura.sistema_gerenciamento_formaturas.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "presencas_evento")
public class PresencaEvento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Evento evento;

    @ManyToOne(optional = false)
    private Aluno aluno;

    @Column(nullable = false)
    private String status;
}