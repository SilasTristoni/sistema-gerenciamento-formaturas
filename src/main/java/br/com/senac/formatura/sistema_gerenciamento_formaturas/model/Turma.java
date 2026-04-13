package br.com.senac.formatura.sistema_gerenciamento_formaturas.model;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import lombok.Data;
import lombok.ToString;

@Data
@ToString(exclude = {"alunos", "eventos", "lancamentos"})
@Entity
public class Turma {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String curso;
    private String instituicao;

    @OneToMany(mappedBy = "turma", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Aluno> alunos;

    @OneToMany(mappedBy = "turma")
    @JsonIgnore
    private List<Evento> eventos;

    @OneToMany(mappedBy = "turma")
    @JsonIgnore
    private List<LancamentoFinanceiro> lancamentos;

    private Double totalArrecadado = 0.0;
    private Double metaArrecadacao = 0.0;
    private String status = "emdia";

    public Integer getQuantidadeAlunos() {
        return alunos != null ? alunos.size() : 0;
    }
}
